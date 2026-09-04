import crypto from "crypto";
import { Entitlement } from "../../lib/types";

export interface JwtClaims {
  iss: "timeframe";
  sub: string;
  iat: number;
  exp: number;
  tier: "free" | "pro";
  plan: "monthly" | "annual" | "skin" | null;
  src: string | null;
  ref: string | null;
  skin: "classic" | null;
  jti: string | null;
}

const JWT_SECRET = process.env.ENTITLEMENT_JWT_SECRET || "timeframe-local-dev-signing-key-32b";

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

export function signEntitlementJwt(entitlement: Entitlement): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const ttlSec = entitlement.plan === "skin" ? 365 * 24 * 3600 : 7 * 24 * 3600;

  const header = { alg: "HS256", typ: "JWT" };
  const payload: JwtClaims = {
    iss: "timeframe",
    sub: entitlement.aid || `aid-${Date.now()}`,
    iat: nowSec,
    exp: nowSec + ttlSec,
    tier: entitlement.tier,
    plan: entitlement.plan,
    src: entitlement.src,
    ref: entitlement.ref,
    skin: entitlement.skin,
    jti: entitlement.jti,
  };

  const headerEnc = base64UrlEncode(JSON.stringify(header));
  const payloadEnc = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${headerEnc}.${payloadEnc}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${headerEnc}.${payloadEnc}.${signature}`;
}

export function verifyEntitlementJwt(token: string): JwtClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerEnc, payloadEnc, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${headerEnc}.${payloadEnc}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEnc)) as JwtClaims;
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp < nowSec) return null;
    return payload;
  } catch {
    return null;
  }
}

export const verifyJwt = verifyEntitlementJwt;
export const signJwt = signEntitlementJwt;

