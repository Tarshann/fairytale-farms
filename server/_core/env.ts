const DEFAULT_ADMIN_EMAILS = [
  "tarshann@gmail.com",
  "fairytalefarms.net@gmail.com",
];

const parseAdminEmails = (raw: string) =>
  raw
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);

const nodeEnv = process.env.NODE_ENV ?? "development";

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = nodeEnv;
}

const allowDevLogin =
  process.env.DEV_LOGIN_ENABLED === "true" ||
  process.env.ALLOW_DEV_LOGIN === "true";
const rawAppId = process.env.VITE_APP_ID ?? "";
const rawCookieSecret = process.env.JWT_SECRET ?? "";

export const ENV = {
  appId: rawAppId || (allowDevLogin ? "dev-app" : ""),
  cookieSecret: rawCookieSecret || (allowDevLogin ? "dev-secret" : ""),
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
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
  isProduction: nodeEnv === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
