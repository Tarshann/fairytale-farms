import crypto from "crypto";

export type CreateCodeResult = {
  code: string;
  expiresAt: Date;
  codeHash: string;
};

export function generateNumericCode(length = 6): string {
  const max = 10 ** length;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(length, "0");
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function createLoginCode(
  email: string,
  secret: string,
  ttlMinutes = 15
): CreateCodeResult {
  const normalized = email.trim().toLowerCase();
  const code = generateNumericCode(6);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  const codeHash = sha256(`${normalized}:${code}:${secret}`);

  return { code, expiresAt, codeHash };
}

export function verifyLoginCode(
  email: string,
  code: string,
  secret: string,
  expectedHash: string
): boolean {
  const normalized = email.trim().toLowerCase();
  const candidate = sha256(`${normalized}:${code}:${secret}`);
  return crypto.timingSafeEqual(
    Buffer.from(candidate),
    Buffer.from(expectedHash)
  );
}
