import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";

// We need to mock the crypto module partially for deterministic salt in some tests,
// but keep real crypto for encrypt/decrypt round-trip tests.
// The security module uses module-level state (inMemoryKey, isUnlocked) so we
// re-import fresh for each test group.

// Use dynamic import after resetting modules
let security: typeof import("../../../src/main/security");

// Create a minimal in-memory settings store that behaves like SQLite
function createMockDb() {
  const store = new Map<string, string>();
  return {
    prepare: vi.fn((sql: string) => {
      if (sql.includes("SELECT")) {
        return {
          get: vi.fn((...args: string[]) => {
            const key = Array.isArray(args[0]) ? args[0][0] : args[0];
            const val = store.get(key);
            return val ? { value: val } : undefined;
          }),
        };
      }
      if (sql.includes("INSERT OR REPLACE")) {
        return {
          run: vi.fn((...args: unknown[]) => {
            const params = Array.isArray(args[0]) ? args[0] : args;
            store.set(params[0] as string, params[1] as string);
          }),
        };
      }
      return { get: vi.fn(), run: vi.fn() };
    }),
    _store: store,
  } as unknown as import("../../../src/main/database/sqlite").default.Database;
}

describe("security module", () => {
  let db: ReturnType<typeof createMockDb>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    // Reset module-level state by clearing the module cache
    vi.resetModules();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    security = await import("../../../src/main/security");
    db = createMockDb();
  });

  afterEach(() => {
    // Ensure locked after each test
    security.lock();
    consoleErrorSpy.mockRestore();
  });

  // ─────────────────────────────────────────────
  // setMasterPassword
  // ─────────────────────────────────────────────
  describe("setMasterPassword", () => {
    it("stores hashed password and unlocks", () => {
      security.setMasterPassword(db, "my-secret");

      expect(security.getKey()).not.toBeNull();
      expect(security.getKey()!.length).toBe(32); // 256-bit key

      const status = security.securityStatus(db);
      expect(status.configured).toBe(true);
      expect(status.unlocked).toBe(true);
    });

    it("overwrites previous password", () => {
      security.setMasterPassword(db, "password1");
      const key1 = security.getKey();

      security.setMasterPassword(db, "password2");
      const key2 = security.getKey();

      // Different passwords should produce different keys (overwhelmingly likely)
      expect(key1!.equals(key2!)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // unlock
  // ─────────────────────────────────────────────
  describe("unlock", () => {
    it("returns true with correct password", () => {
      security.setMasterPassword(db, "correct-pass");
      security.lock();

      expect(security.unlock(db, "correct-pass")).toBe(true);
      expect(security.getKey()).not.toBeNull();
    });

    it("returns false with wrong password", () => {
      security.setMasterPassword(db, "correct-pass");
      security.lock();

      expect(security.unlock(db, "wrong-pass")).toBe(false);
      expect(security.getKey()).toBeNull();
      expect(security.securityStatus(db).unlocked).toBe(false);
    });

    it("returns false when no password is configured", () => {
      expect(security.unlock(db, "anything")).toBe(false);
      expect(security.getKey()).toBeNull();
      expect(security.securityStatus(db).unlocked).toBe(false);
    });

    it("fails closed when the stored master password payload is structurally invalid", () => {
      (db as any)._store.set(
        "master_password",
        JSON.stringify({ salt: "bad", hash: "bad" }),
      );

      expect(security.unlock(db, "anything")).toBe(false);
      expect(security.getKey()).toBeNull();
      expect(security.securityStatus(db)).toEqual({
        configured: false,
        unlocked: false,
      });
    });

    it("clears existing unlocked state after a failed unlock attempt", () => {
      security.setMasterPassword(db, "correct-pass");
      expect(security.securityStatus(db).unlocked).toBe(true);

      expect(security.unlock(db, "wrong-pass")).toBe(false);
      expect(security.getKey()).toBeNull();
      expect(security.securityStatus(db).unlocked).toBe(false);
    });
  });

  describe("changeMasterPassword", () => {
    it("changes password only when current password matches", () => {
      security.setMasterPassword(db, "old-password");
      security.lock();

      expect(
        security.changeMasterPassword(db, "old-password", "new-password"),
      ).toBe(true);
      expect(security.securityStatus(db).unlocked).toBe(true);

      security.lock();
      expect(security.unlock(db, "old-password")).toBe(false);
      expect(security.unlock(db, "new-password")).toBe(true);
    });

    it("does not change password when current password is wrong", () => {
      security.setMasterPassword(db, "old-password");
      security.lock();

      expect(
        security.changeMasterPassword(db, "wrong-password", "new-password"),
      ).toBe(false);
      expect(security.securityStatus(db).unlocked).toBe(false);

      expect(security.unlock(db, "old-password")).toBe(true);
      security.lock();
      expect(security.unlock(db, "new-password")).toBe(false);
    });

    it("fails closed when the stored password record is corrupted", () => {
      security.setMasterPassword(db, "old-password");
      expect(security.securityStatus(db).unlocked).toBe(true);

      (db as any)._store.set(
        "master_password",
        JSON.stringify({ salt: "bad", hash: "bad" }),
      );

      expect(
        security.changeMasterPassword(db, "old-password", "new-password"),
      ).toBe(false);
      expect(security.securityStatus(db)).toEqual({
        configured: false,
        unlocked: false,
      });
    });
  });

  // ─────────────────────────────────────────────
  // lock
  // ─────────────────────────────────────────────
  describe("lock", () => {
    it("clears key and sets unlocked to false", () => {
      security.setMasterPassword(db, "pass");
      expect(security.getKey()).not.toBeNull();

      security.lock();
      expect(security.getKey()).toBeNull();
      expect(security.securityStatus(db).unlocked).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // securityStatus
  // ─────────────────────────────────────────────
  describe("securityStatus", () => {
    it("reports not configured and not unlocked initially", () => {
      const status = security.securityStatus(db);
      expect(status.configured).toBe(false);
      expect(status.unlocked).toBe(false);
    });

    it("reports configured after setMasterPassword", () => {
      security.setMasterPassword(db, "pass");
      expect(security.securityStatus(db).configured).toBe(true);
    });

    it("reports not configured when the stored payload is malformed JSON", () => {
      (db as any)._store.set("master_password", "{not-json");

      expect(security.securityStatus(db)).toEqual({
        configured: false,
        unlocked: false,
      });
    });
  });

  // ─────────────────────────────────────────────
  // encryptText / decryptText round-trip
  // ─────────────────────────────────────────────
  describe("encryptText + decryptText", () => {
    it("round-trips plaintext correctly", () => {
      security.setMasterPassword(db, "test-key");
      const key = security.getKey()!;

      const plaintext = "Hello, World! 你好世界 🎉";
      const encrypted = security.encryptText(plaintext, key);

      expect(encrypted).toMatch(/^ENC::/);
      expect(encrypted).not.toContain(plaintext);

      const decrypted = security.decryptText(encrypted, key);
      expect(decrypted).toBe(plaintext);
    });

    it("produces different ciphertext each time (random IV)", () => {
      security.setMasterPassword(db, "key");
      const key = security.getKey()!;

      const enc1 = security.encryptText("same", key);
      const enc2 = security.encryptText("same", key);
      expect(enc1).not.toBe(enc2); // Different IV → different ciphertext
    });

    it("decryptText returns original string if not ENC:: prefixed", () => {
      security.setMasterPassword(db, "key");
      const key = security.getKey()!;

      expect(security.decryptText("plain text", key)).toBe("plain text");
      expect(security.decryptText("", key)).toBe("");
    });

    it("decryptText returns null for tampered ciphertext", () => {
      security.setMasterPassword(db, "key");
      const key = security.getKey()!;

      const encrypted = security.encryptText("secret", key);
      // Tamper with the base64 payload
      const tampered = encrypted.slice(0, -2) + "XX";

      expect(security.decryptText(tampered, key)).toBeNull();
    });

    it("decryptText returns null with wrong key", () => {
      security.setMasterPassword(db, "key1");
      const key1 = security.getKey()!;
      const encrypted = security.encryptText("secret", key1);

      security.setMasterPassword(db, "key2");
      const key2 = security.getKey()!;

      expect(security.decryptText(encrypted, key2)).toBeNull();
    });

    it("handles empty string encryption", () => {
      security.setMasterPassword(db, "key");
      const key = security.getKey()!;

      const encrypted = security.encryptText("", key);
      expect(encrypted).toMatch(/^ENC::/);
      expect(security.decryptText(encrypted, key)).toBe("");
    });
  });

  // ─────────────────────────────────────────────
  // getUnlockedKey (alias)
  // ─────────────────────────────────────────────
  describe("getUnlockedKey", () => {
    it("is an alias for getKey — returns same reference", () => {
      security.setMasterPassword(db, "pass");
      expect(security.getUnlockedKey()).toBe(security.getKey());
    });
  });

  // ─────────────────────────────────────────────
  // Adversarial / fuzz-style boundary tests
  // ─────────────────────────────────────────────
  describe("adversarial inputs", () => {
    // Password edge cases — the deriveKey uses scrypt which must handle arbitrary strings
    it("handles empty string password (set + unlock round-trip)", () => {
      security.setMasterPassword(db, "");
      const key = security.getKey();
      expect(key).not.toBeNull();
      expect(key!.length).toBe(32);

      security.lock();
      expect(security.unlock(db, "")).toBe(true);
      expect(security.unlock(db, " ")).toBe(false); // space ≠ empty
    });

    it("handles extremely long password (10KB)", () => {
      const longPwd = "A".repeat(10_000);
      security.setMasterPassword(db, longPwd);
      const key = security.getKey()!;
      expect(key.length).toBe(32);

      security.lock();
      expect(security.unlock(db, longPwd)).toBe(true);
      // Off-by-one: one char shorter must fail
      expect(security.unlock(db, longPwd.slice(0, -1))).toBe(false);
    });

    it("handles unicode/emoji password", () => {
      const emojiPwd = "密码🔐пароль🎉";
      security.setMasterPassword(db, emojiPwd);
      security.lock();
      expect(security.unlock(db, emojiPwd)).toBe(true);
      // Visually similar but different codepoint
      expect(security.unlock(db, "密码🔐пароль🎊")).toBe(false);
    });

    it("handles password with null bytes", () => {
      const nullPwd = "pass\x00word";
      security.setMasterPassword(db, nullPwd);
      security.lock();
      expect(security.unlock(db, nullPwd)).toBe(true);
      // Without null byte
      expect(security.unlock(db, "password")).toBe(false);
      // Truncated at null
      expect(security.unlock(db, "pass")).toBe(false);
    });

    // Encryption edge cases
    it("encrypts and decrypts binary-like string with all byte values (latin1 range)", () => {
      security.setMasterPassword(db, "key");
      const key = security.getKey()!;

      // Build a string with codepoints 0-255
      let binaryStr = "";
      for (let i = 0; i < 256; i++) {
        binaryStr += String.fromCharCode(i);
      }
      const encrypted = security.encryptText(binaryStr, key);
      const decrypted = security.decryptText(encrypted, key);
      expect(decrypted).toBe(binaryStr);
    });

    it("encrypts and decrypts large payload (1MB)", () => {
      security.setMasterPassword(db, "key");
      const key = security.getKey()!;

      const large = "X".repeat(1_000_000);
      const encrypted = security.encryptText(large, key);
      const decrypted = security.decryptText(encrypted, key);
      expect(decrypted).toBe(large);
    });

    // Tamper detection: bit-flip in IV, auth tag, and ciphertext
    it("rejects ciphertext with flipped bit in IV (first 12 bytes)", () => {
      security.setMasterPassword(db, "key");
      const key = security.getKey()!;

      const encrypted = security.encryptText("secret data", key);
      const base64 = encrypted.slice(5); // remove "ENC::"
      const buf = Buffer.from(base64, "base64");

      // Flip bit in IV (byte 0)
      buf[0] ^= 0x01;
      const tampered = `ENC::${buf.toString("base64")}`;
      expect(security.decryptText(tampered, key)).toBeNull();
    });

    it("rejects ciphertext with flipped bit in auth tag (bytes 12-27)", () => {
      security.setMasterPassword(db, "key");
      const key = security.getKey()!;

      const encrypted = security.encryptText("secret data", key);
      const buf = Buffer.from(encrypted.slice(5), "base64");

      // Flip bit in auth tag
      buf[15] ^= 0x80;
      const tampered = `ENC::${buf.toString("base64")}`;
      expect(security.decryptText(tampered, key)).toBeNull();
    });

    it("rejects ciphertext with flipped bit in encrypted payload", () => {
      security.setMasterPassword(db, "key");
      const key = security.getKey()!;

      const encrypted = security.encryptText("secret data", key);
      const buf = Buffer.from(encrypted.slice(5), "base64");

      // Flip bit in ciphertext (after IV+tag = 28 bytes)
      if (buf.length > 28) {
        buf[28] ^= 0x01;
      }
      const tampered = `ENC::${buf.toString("base64")}`;
      expect(security.decryptText(tampered, key)).toBeNull();
    });

    it("rejects truncated ciphertext (missing auth tag)", () => {
      security.setMasterPassword(db, "key");
      const key = security.getKey()!;

      const encrypted = security.encryptText("data", key);
      const buf = Buffer.from(encrypted.slice(5), "base64");
      // Only keep IV (12 bytes), truncate rest
      const truncated = `ENC::${buf.subarray(0, 12).toString("base64")}`;
      expect(security.decryptText(truncated, key)).toBeNull();
    });

    it("rejects completely empty payload after ENC:: prefix", () => {
      security.setMasterPassword(db, "key");
      const key = security.getKey()!;

      expect(security.decryptText("ENC::", key)).toBeNull();
    });

    it("rejects ENC:: with invalid base64", () => {
      security.setMasterPassword(db, "key");
      const key = security.getKey()!;

      expect(security.decryptText("ENC::not-valid-base64!!!", key)).toBeNull();
    });

    // State machine: multiple set/lock/unlock cycles
    it("survives rapid set→lock→unlock cycles", () => {
      for (let i = 0; i < 10; i++) {
        const pwd = `password-${i}`;
        security.setMasterPassword(db, pwd);
        expect(security.getKey()).not.toBeNull();

        security.lock();
        expect(security.getKey()).toBeNull();

        expect(security.unlock(db, pwd)).toBe(true);
        expect(security.getKey()).not.toBeNull();
      }
    });

    // Verify that setMasterPassword truly replaces (old password no longer works)
    it("old password fails after setMasterPassword with new password", () => {
      security.setMasterPassword(db, "old-password");
      security.lock();

      security.setMasterPassword(db, "new-password");
      security.lock();

      expect(security.unlock(db, "old-password")).toBe(false);
      expect(security.unlock(db, "new-password")).toBe(true);
    });

    // decryptText edge: null/undefined input safety
    it("decryptText returns null/empty for falsy inputs", () => {
      security.setMasterPassword(db, "key");
      const key = security.getKey()!;

      // Source: line 94 — `if (!data || !data.startsWith('ENC::')) return data;`
      // null and undefined should return the value as-is (or null)
      expect(security.decryptText(null as unknown as string, key)).toBeFalsy();
      expect(
        security.decryptText(undefined as unknown as string, key),
      ).toBeFalsy();
    });

    // Key derivation uniqueness: same password different salt → different key
    it("produces unique keys for same password across different setMasterPassword calls", () => {
      security.setMasterPassword(db, "same-password");
      const key1 = Buffer.from(security.getKey()!);

      security.setMasterPassword(db, "same-password");
      const key2 = Buffer.from(security.getKey()!);

      // Overwhelmingly likely to be different due to random salt
      // (probability of collision: 2^-128)
      expect(key1.equals(key2)).toBe(false);
    });
  });
});
