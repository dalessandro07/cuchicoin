import * as schema from "@/db/schema";
import { db } from "@/db/server";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const authBaseURL = (
  process.env.BETTER_AUTH_URL ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:8081"
).replace(/\/$/, "");

const extraTrustedOrigins = (process.env.TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  baseURL: authBaseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      firstName: { type: "string", required: true },
      lastName: { type: "string", required: true },
      phone: { type: "string" },
    },
  },
  plugins: [expo()],
  trustedOrigins: [
    "kuchicoin://",
    authBaseURL,
    ...extraTrustedOrigins,
    ...(process.env.NODE_ENV === "development"
      ? ["exp://", "exp://**", "exp://192.168.*.*:*/**"]
      : []),
  ],
});
