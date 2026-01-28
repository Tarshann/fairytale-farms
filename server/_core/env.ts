const DEFAULT_ADMIN_EMAILS = [
  "tarshann@gmail.com",
  "fairytalefarms.net@gmail.com",
];

const parseAdminEmails = (raw: string) =>
  raw
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);

const allowDevLogin =
  process.env.DEV_LOGIN_ENABLED === "true" ||
  process.env.ALLOW_DEV_LOGIN === "true";
const rawAppId = process.env.VITE_APP_ID ?? "";
const rawCookieSecret = process.env.JWT_SECRET ?? "";
const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";
const oAuthServerUrl = (process.env.OAUTH_SERVER_URL ?? "").trim();

export const ENV = {
  appId: rawAppId || (allowDevLogin ? "dev-app" : ""),
  cookieSecret: rawCookieSecret || (allowDevLogin ? "dev-secret" : ""),
  databaseUrl: (process.env.DATABASE_URL ?? "").trim(),
  oAuthServerUrl,
  oauthEnabled: Boolean(oAuthServerUrl),
  ownerOpenId: (process.env.OWNER_OPEN_ID ?? "").trim(),
  ownerEmail: (process.env.OWNER_EMAIL ?? process.env.ADMIN_EMAIL ?? "")
    .trim()
    .toLowerCase(),
  adminEmails: Array.from(
    new Set([
      ...DEFAULT_ADMIN_EMAILS,
      ...parseAdminEmails(process.env.ADMIN_EMAILS ?? ""),
    ])
  ),
  allowDevLogin,
  isProduction,
  forgeApiUrl: (process.env.BUILT_IN_FORGE_API_URL ?? "").trim(),
  forgeApiKey: (process.env.BUILT_IN_FORGE_API_KEY ?? "").trim(),
};

if (ENV.isProduction && !ENV.oauthEnabled) {
  throw new Error("Missing OAUTH_SERVER_URL in production environment.");
}
