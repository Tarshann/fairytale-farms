import { COOKIE_NAME, SESSION_MAX_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

async function getSdk() {
  const mod = await import("./sdk");
  return mod.sdk;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/dev-login", async (req: Request, res: Response) => {
    if (!ENV.allowDevLogin || ENV.isProduction) {
      res.status(404).send("Not Found");
      return;
    }

    const emailParam = getQueryParam(req, "email")?.trim().toLowerCase();
    const nameParam = getQueryParam(req, "name")?.trim();
    // Only allow relative paths to prevent open redirect attacks
    const rawRedirect = getQueryParam(req, "redirect") || "/admin";
    const redirectParam = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/admin";

    if (!emailParam) {
      // Sanitize redirectParam to prevent XSS injection in the HTML template
      const safeRedirect = redirectParam.replace(/[&<>"']/g, (ch: string) => {
        const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
        return entities[ch] ?? ch;
      });
      res.status(200).send(`
        <html>
          <head>
            <title>Dev Login</title>
            <meta charset="utf-8" />
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              form { max-width: 420px; margin: 0 auto; }
              input { width: 100%; padding: 10px; margin-top: 8px; }
              button { margin-top: 16px; padding: 10px 16px; }
            </style>
          </head>
          <body>
            <h1>Dev Login</h1>
            <p>Enter an email to create a dev session.</p>
            <form method="get" action="/api/dev-login">
              <label>Email</label>
              <input type="email" name="email" required />
              <label>Name (optional)</label>
              <input type="text" name="name" />
              <input type="hidden" name="redirect" value="${safeRedirect}" />
              <button type="submit">Sign In</button>
            </form>
          </body>
        </html>
      `);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailParam)) {
      res.status(400).send("Invalid email address");
      return;
    }

    const displayName = nameParam || emailParam.split("@")[0];
    const openId = `dev:${emailParam}`;

    await db.upsertUser({
      openId,
      name: displayName,
      email: emailParam,
      loginMethod: "dev",
      lastSignedIn: new Date(),
    });

    const sdk = await getSdk();
    const sessionToken = await sdk.createSessionToken(openId, {
      name: displayName,
      expiresInMs: SESSION_MAX_MS,
    });
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, {
      ...cookieOptions,
      maxAge: SESSION_MAX_MS,
    });
    // Final redirect safety check: only allow relative paths
    const safeRedirectTarget = redirectParam.startsWith("/") && !redirectParam.startsWith("//") ? redirectParam : "/admin";
    res.redirect(302, safeRedirectTarget);
  });

  if (!ENV.oauthEnabled) {
    app.get("/api/oauth/callback", (_req: Request, res: Response) => {
      res.status(503).json({
        error:
          "OAuth is not configured in this environment. Set OAUTH_SERVER_URL to enable login.",
      });
    });
    return;
  }

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const sdk = await getSdk();
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: SESSION_MAX_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: SESSION_MAX_MS,
      });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
