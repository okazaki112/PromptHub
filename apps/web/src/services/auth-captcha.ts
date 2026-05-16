import { randomUUID } from 'node:crypto';
import { create } from 'svg-captcha';
import { ErrorCode } from '../utils/response.js';

const CAPTCHA_TTL_MS = 5 * 60 * 1000;

const CAPTCHA_OPTIONS = {
  size: 5,
  width: 160,
  height: 56,
  fontSize: 42,
  noise: 4,
  color: true,
  background: '#f8fafc',
  ignoreChars: '0o1iIl',
} as const;

interface CaptchaChallengeRecord {
  answer: string;
  clientId: string;
  expiresAt: number;
}

export interface AuthCaptchaChallenge {
  captchaId: string;
  expiresInSeconds: number;
  imageData: string;
}

export class AuthCaptchaError extends Error {
  constructor(
    public readonly status: 422,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AuthCaptchaError';
  }
}

const challenges = new Map<string, CaptchaChallengeRecord>();

function cleanupExpiredChallenges(): void {
  const currentTime = Date.now();

  for (const [captchaId, challenge] of challenges.entries()) {
    if (challenge.expiresAt <= currentTime) {
      challenges.delete(captchaId);
    }
  }
}

function buildSvgCaptcha(): { answer: string; imageData: string } {
  const captcha = create(CAPTCHA_OPTIONS);
  return {
    answer: captcha.text.toLowerCase(),
    imageData: `data:image/svg+xml;base64,${Buffer.from(captcha.data, 'utf8').toString('base64')}`,
  };
}

export function issueAuthCaptcha(clientId: string): AuthCaptchaChallenge {
  cleanupExpiredChallenges();

  const { answer, imageData } = buildSvgCaptcha();
  const captchaId = randomUUID();

  challenges.set(captchaId, {
    answer,
    clientId,
    expiresAt: Date.now() + CAPTCHA_TTL_MS,
  });

  return {
    captchaId,
    expiresInSeconds: Math.floor(CAPTCHA_TTL_MS / 1000),
    imageData,
  };
}

export function verifyAuthCaptcha(
  clientId: string,
  captchaId: string,
  captchaAnswer: string,
): void {
  cleanupExpiredChallenges();

  const challenge = challenges.get(captchaId);
  challenges.delete(captchaId);

  if (!challenge) {
    throw new AuthCaptchaError(
      422,
      ErrorCode.VALIDATION_ERROR,
      'Captcha challenge is missing or expired',
    );
  }

  if (challenge.clientId !== clientId) {
    throw new AuthCaptchaError(
      422,
      ErrorCode.VALIDATION_ERROR,
      'Captcha challenge does not match this client',
    );
  }

  if (challenge.expiresAt <= Date.now()) {
    throw new AuthCaptchaError(
      422,
      ErrorCode.VALIDATION_ERROR,
      'Captcha challenge is missing or expired',
    );
  }

  if (challenge.answer !== captchaAnswer.trim().toLowerCase()) {
    throw new AuthCaptchaError(
      422,
      ErrorCode.VALIDATION_ERROR,
      'Invalid captcha answer',
    );
  }
}

export function getCaptchaAnswerForTesting(captchaId: string): string | null {
  const challenge = challenges.get(captchaId);
  return challenge?.answer ?? null;
}

export function resetCaptchaChallenges(): void {
  challenges.clear();
}
