import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const envPath = process.env.NODE_ENV === "production" ? ".env" : ".env.local";
const resolvedEnvPath = path.resolve(process.cwd(), envPath);

if (fs.existsSync(resolvedEnvPath)) {
  dotenv.config({ path: resolvedEnvPath });
} else {
  dotenv.config();
}
