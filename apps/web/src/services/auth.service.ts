import { createHash, randomUUID } from 'node:crypto';
import bcryptjs from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { Database } from '@prompthub/db';
import { getServerDatabase } from '../database.js';
import { config } from '../config.js';
import { ErrorCode } from '../utils/response.js';

const PASSWORD_HASH_ROUNDS = process.env.VITEST ? 1 : 12;
const JWT_ALGORITHM = 'HS256';
const { compare, hash } = bcryptjs;

export const TOKEN_ISSUER = 'prompthub-server';
export const ACCESS_TOKEN_AUDIENCE = 'prompthub-api';
export const REFRESH_TOKEN_AUDIENCE = 'prompthub-refresh';

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: number;
  updated_at: number;
}

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: number;
  created_at: number;
}

interface TokenPayload {
  tokenType: 'access' | 'refresh';
}

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface AuthResult extends AuthTokens {
  user: AuthUser;
}

export interface BootstrapStatus {
  initialized: boolean;
  registrationAllowed: boolean;
}

export class AuthServiceError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 500,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

export class AuthService {
  private readonly db: Database;
  private readonly secret: Uint8Array;

  constructor(database?: Database) {
    this.db = database ?? getServerDatabase();
    this.secret = new TextEncoder().encode(config.jwt.secret);
  }

  async register(username: string, password: string): Promise<AuthResult> {
    await this.cleanupExpiredRefreshTokens();

    if (!(await this.canRegister())) {
      throw new AuthServiceError(
        403,
        ErrorCode.FORBIDDEN,
        'Registration is disabled',
      );
    }

    const normalizedUsername = username.trim();
    const existingUser = this.getUserByUsername(normalizedUsername);
    if (existingUser) {
      throw new AuthServiceError(409, ErrorCode.CONFLICT, 'Username already exists');
    }

    const now = Date.now();
    const userId = randomUUID();
    const passwordHash = await hash(password, PASSWORD_HASH_ROUNDS);
    const role = this.getUserCount() === 0 ? 'admin' : 'user';

    this.db
      .prepare(
        `INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(userId, normalizedUsername, passwordHash, role, now, now);

    if (role === 'admin') {
      this.claimUnownedPrivateResources(userId);
    }

    const user = this.requireUserById(userId);
    const tokens = await this.issueTokenPair(user.id);

    return {
      user: this.toAuthUser(user),
      ...tokens,
    };
  }

  async getBootstrapStatus(): Promise<BootstrapStatus> {
    const initialized = this.getUserCount() > 0;

    return {
      initialized,
      registrationAllowed: await this.canRegister(),
    };
  }

  async login(username: string, password: string): Promise<AuthResult> {
    await this.cleanupExpiredRefreshTokens();

    const user = this.getUserByUsername(username.trim());
    if (!user) {
      throw new AuthServiceError(
        401,
        ErrorCode.UNAUTHORIZED,
        'Invalid username or password',
      );
    }

    const passwordMatches = await compare(password, user.password_hash);
    if (!passwordMatches) {
      throw new AuthServiceError(
        401,
        ErrorCode.UNAUTHORIZED,
        'Invalid username or password',
      );
    }

    const tokens = await this.issueTokenPair(user.id);

    return {
      user: this.toAuthUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    await this.cleanupExpiredRefreshTokens();

    const { payload } = await this.verifyToken(refreshToken, 'refresh');
    const tokenId = this.getRequiredStringClaim(payload.jti, 'jti');
    const userId = this.getRequiredStringClaim(payload.sub, 'sub');

    const row = this.getRefreshTokenById(tokenId);
    if (!row || row.user_id !== userId || row.token_hash !== this.hashToken(refreshToken)) {
      throw new AuthServiceError(
        401,
        ErrorCode.UNAUTHORIZED,
        'Refresh token is invalid',
      );
    }

    if (row.expires_at <= Date.now()) {
      this.deleteRefreshTokenById(tokenId);
      throw new AuthServiceError(
        401,
        ErrorCode.UNAUTHORIZED,
        'Refresh token has expired',
      );
    }

    this.deleteRefreshTokenById(tokenId);

    const user = this.requireUserById(userId);
    const tokens = await this.issueTokenPair(user.id);

    return {
      user: this.toAuthUser(user),
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.cleanupExpiredRefreshTokens();

    const { payload } = await this.verifyToken(refreshToken, 'refresh');
    const tokenId = this.getRequiredStringClaim(payload.jti, 'jti');
    const tokenUserId = this.getRequiredStringClaim(payload.sub, 'sub');

    if (tokenUserId !== userId) {
      throw new AuthServiceError(
        403,
        ErrorCode.FORBIDDEN,
        'Refresh token does not belong to the authenticated user',
      );
    }

    this.deleteRefreshTokenById(tokenId);
  }

  getCurrentUser(userId: string): AuthUser {
    const user = this.requireUserById(userId);
    return this.toAuthUser(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = this.requireUserById(userId);
    const passwordMatches = await compare(currentPassword, user.password_hash);

    if (!passwordMatches) {
      throw new AuthServiceError(
        401,
        ErrorCode.UNAUTHORIZED,
        'Current password is incorrect',
      );
    }

    const newPasswordHash = await hash(newPassword, PASSWORD_HASH_ROUNDS);
    const now = Date.now();

    const runUpdate = this.db.transaction(() => {
      this.db
        .prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
        .run(newPasswordHash, now, userId);
      this.db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
    });

    runUpdate();
  }

  async verifyAccessToken(token: string): Promise<{ userId: string; role: 'admin' | 'user' }> {
    const { payload } = await this.verifyToken(token, 'access');
    const user = this.requireUserById(this.getRequiredStringClaim(payload.sub, 'sub'));
    return {
      userId: user.id,
      role: user.role,
    };
  }

  private async canRegister(): Promise<boolean> {
    if (config.allowRegistration) {
      return true;
    }

    const row = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as
      | { count: number }
      | undefined;

    return !row || row.count === 0;
  }

  private getUserByUsername(username: string): UserRow | null {
    const row = this.db
      .prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)')
      .get(username) as UserRow | undefined;

    return row ?? null;
  }

  private getUserCount(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as
      | { count: number }
      | undefined;

    return row?.count ?? 0;
  }

  private claimUnownedPrivateResources(userId: string): void {
    const statements = [
      'UPDATE prompts SET owner_user_id = ? WHERE owner_user_id IS NULL AND visibility = ?',
      'UPDATE folders SET owner_user_id = ? WHERE owner_user_id IS NULL AND visibility = ?',
      'UPDATE skills SET owner_user_id = ? WHERE owner_user_id IS NULL AND visibility = ?',
    ] as const;

    const transaction = this.db.transaction(() => {
      for (const statement of statements) {
        this.db.prepare(statement).run(userId, 'private');
      }
    });

    transaction();
  }

  private getUserById(userId: string): UserRow | null {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as
      | UserRow
      | undefined;

    return row ?? null;
  }

  private requireUserById(userId: string): UserRow {
    const user = this.getUserById(userId);
    if (!user) {
      throw new AuthServiceError(401, ErrorCode.UNAUTHORIZED, 'User does not exist');
    }
    return user;
  }

  private getRefreshTokenById(tokenId: string): RefreshTokenRow | null {
    const row = this.db
      .prepare('SELECT * FROM refresh_tokens WHERE id = ?')
      .get(tokenId) as RefreshTokenRow | undefined;

    return row ?? null;
  }

  private deleteRefreshTokenById(tokenId: string): void {
    this.db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(tokenId);
  }

  private async issueTokenPair(userId: string): Promise<AuthTokens> {
    const accessToken = await this.createJwt(userId, 'access', config.jwt.accessTtl);
    const refreshTokenId = randomUUID();
    const refreshToken = await this.createJwt(
      userId,
      'refresh',
      config.jwt.refreshTtl,
      refreshTokenId,
    );

    const now = Date.now();
    const refreshExpiresAt = now + config.jwt.refreshTtl * 1000;

    this.db
      .prepare(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        refreshTokenId,
        userId,
        this.hashToken(refreshToken),
        refreshExpiresAt,
        now,
      );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: config.jwt.accessTtl,
      refreshTokenExpiresIn: config.jwt.refreshTtl,
    };
  }

  private async createJwt(
    userId: string,
    tokenType: 'access' | 'refresh',
    ttlSeconds: number,
    tokenId?: string,
  ): Promise<string> {
    const audience =
      tokenType === 'access' ? ACCESS_TOKEN_AUDIENCE : REFRESH_TOKEN_AUDIENCE;
    const nowInSeconds = Math.floor(Date.now() / 1000);

    const jwt = new SignJWT({ tokenType } satisfies TokenPayload)
      .setProtectedHeader({ alg: JWT_ALGORITHM, typ: 'JWT' })
      .setIssuedAt(nowInSeconds)
      .setIssuer(TOKEN_ISSUER)
      .setAudience(audience)
      .setSubject(userId)
      .setExpirationTime(nowInSeconds + ttlSeconds);

    if (tokenId) {
      jwt.setJti(tokenId);
    }

    return jwt.sign(this.secret);
  }

  private async verifyToken(
    token: string,
    tokenType: 'access' | 'refresh',
  ) {
    try {
      const audience =
        tokenType === 'access' ? ACCESS_TOKEN_AUDIENCE : REFRESH_TOKEN_AUDIENCE;
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: TOKEN_ISSUER,
        audience,
        algorithms: [JWT_ALGORITHM],
        clockTolerance: 5,
      });

      if (payload.tokenType !== tokenType) {
        throw new AuthServiceError(401, ErrorCode.UNAUTHORIZED, 'Token type is invalid');
      }

      return { payload };
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }

      throw new AuthServiceError(401, ErrorCode.UNAUTHORIZED, 'Token expired or invalid');
    }
  }

  private async cleanupExpiredRefreshTokens(): Promise<void> {
    this.db.prepare('DELETE FROM refresh_tokens WHERE expires_at <= ?').run(Date.now());
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getRequiredStringClaim(value: unknown, claimName: string): string {
    if (typeof value !== 'string' || value.length === 0) {
      throw new AuthServiceError(
        401,
        ErrorCode.UNAUTHORIZED,
        `Token claim ${claimName} is invalid`,
      );
    }

    return value;
  }

  private toAuthUser(user: UserRow): AuthUser {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: new Date(user.created_at).toISOString(),
      updatedAt: new Date(user.updated_at).toISOString(),
    };
  }
}
