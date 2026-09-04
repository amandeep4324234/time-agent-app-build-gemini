import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createDevProEntitlement,
  createFreeEntitlement,
  isDevEntitlement,
  isDevEnvironment,
  isPaid,
  DEV_PRO_AID,
  DEV_PRO_SRC,
  DEV_PRO_REF,
  DEV_PRO_JTI,
} from "../entitlement";
import { Entitlement } from "../types";
import { signEntitlementJwt } from "../../adapters/entitlement-jwt/jwt";
import { GET as devGet, POST as devPost } from "../../app/api/dev/entitlement/route";
import { POST as grantPost } from "../../app/api/entitlement/grant/route";
import { GET as meGet } from "../../app/api/entitlement/me/route";
import { POST as pairingIssuePost } from "../../app/api/pairing/issue/route";
import { POST as pairingRedeemPost } from "../../app/api/pairing/redeem/route";
import { POST as refreshPost } from "../../app/api/entitlement/refresh/route";
import { POST as restorePost } from "../../app/api/entitlement/restore/route";
import { NextRequest } from "next/server";

describe("Developer Paid Feature Access & Security Deprecation", () => {
  const originalEnv = process.env.NODE_ENV;

  function setNodeEnv(val: string) {
    (process.env as Record<string, string | undefined>).NODE_ENV = val;
  }

  beforeEach(() => {
    // Default to test/development
    setNodeEnv("test");
  });

  afterEach(() => {
    setNodeEnv(originalEnv || "test");
  });

  describe("Dev Pro Entitlement Generation", () => {
    it("generates a valid Pro entitlement in dev/test environment", () => {
      const ent = createDevProEntitlement();
      expect(ent.tier).toBe("pro");
      expect(ent.plan).toBe("annual");
      expect(ent.aid).toBe(DEV_PRO_AID);
      expect(ent.src).toBe(DEV_PRO_SRC);
      expect(ent.ref).toBe(DEV_PRO_REF);
      expect(ent.jti).toBe(DEV_PRO_JTI);
      expect(ent.skin).toBe("classic");
      expect(ent.valid_until).toBeDefined();
      expect(isDevEntitlement(ent)).toBe(true);
    });

    it("throws a security deprecation error if createDevProEntitlement() is invoked in production", () => {
      setNodeEnv("production");
      expect(() => createDevProEntitlement()).toThrow(/SECURITY DEPRECATION/);
    });
  });

  describe("isDevEntitlement & isDevEnvironment", () => {
    it("correctly identifies dev entitlements vs standard entitlements", () => {
      const devEnt = createDevProEntitlement();
      const freeEnt = createFreeEntitlement();
      const customerEnt: Entitlement = {
        aid: "cust-12345",
        tier: "pro",
        plan: "monthly",
        src: "razorpay",
        ref: "pay_98765",
        skin: null,
        valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
        jti: "jti-cust",
      };

      expect(isDevEntitlement(devEnt)).toBe(true);
      expect(isDevEntitlement(freeEnt)).toBe(false);
      expect(isDevEntitlement(customerEnt)).toBe(false);
      expect(isDevEntitlement(null)).toBe(false);
      expect(isDevEntitlement(undefined)).toBe(false);
    });

    it("evaluates isDevEnvironment properly", () => {
      setNodeEnv("development");
      expect(isDevEnvironment()).toBe(true);

      setNodeEnv("test");
      expect(isDevEnvironment()).toBe(true);

      setNodeEnv("production");
      expect(isDevEnvironment()).toBe(false);
    });
  });

  describe("isPaid Evaluation & Production Deprecation Guard", () => {
    it("grants paid access to dev pro entitlement in development", () => {
      setNodeEnv("development");
      const devEnt = createDevProEntitlement();
      expect(isPaid(devEnt)).toBe(true);
    });

    it("returns false for free entitlement in development", () => {
      setNodeEnv("development");
      const freeEnt = createFreeEntitlement();
      expect(isPaid(freeEnt)).toBe(false);
    });

    it("STRICT SECURITY: dev pro entitlement returns false in production (fails closed)", () => {
      // Construct a dev entitlement prior to switching to production
      const devEnt: Entitlement = {
        aid: DEV_PRO_AID,
        tier: "pro",
        plan: "annual",
        src: DEV_PRO_SRC,
        ref: DEV_PRO_REF,
        skin: "classic",
        valid_until: new Date(Date.now() + 365 * 86400000).toISOString(),
        jti: DEV_PRO_JTI,
      };

      setNodeEnv("production");
      // Dev access must be deprecated and blocked in production
      expect(isPaid(devEnt)).toBe(false);
    });

    it("regular paying customers are unaffected in production", () => {
      const activeCustomer: Entitlement = {
        aid: "cust-valid",
        tier: "pro",
        plan: "annual",
        src: "razorpay",
        ref: "pay_real_order",
        skin: null,
        valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
        jti: "jti-real",
      };

      const expiredCustomer: Entitlement = {
        aid: "cust-expired",
        tier: "pro",
        plan: "monthly",
        src: "razorpay",
        ref: "pay_expired",
        skin: null,
        valid_until: new Date(Date.now() - 1000).toISOString(), // expired
        jti: "jti-expired",
      };

      setNodeEnv("production");
      expect(isPaid(activeCustomer)).toBe(true);
      expect(isPaid(expiredCustomer)).toBe(false);
    });
  });

  describe("API Endpoints Security & Deprecation", () => {
    it("/api/dev/entitlement GET returns 200 in development with dev pro token", async () => {
      setNodeEnv("development");
      const res = await devGet();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.isDev).toBe(true);
      expect(data.entitlement.tier).toBe("pro");
      expect(data.token).toBeDefined();
    });

    it("/api/dev/entitlement GET returns 403 DEPRECATED in production", async () => {
      setNodeEnv("production");
      const res = await devGet();
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe("DEPRECATED");
    });

    it("/api/dev/entitlement POST grant/revoke works in development", async () => {
      setNodeEnv("development");
      const grantReq = new NextRequest("http://localhost:3000/api/dev/entitlement", {
        method: "POST",
        body: JSON.stringify({ action: "grant" }),
      });
      const grantRes = await devPost(grantReq);
      expect(grantRes.status).toBe(200);
      const grantData = await grantRes.json();
      expect(grantData.status).toBe("granted");
      expect(grantData.entitlement.tier).toBe("pro");

      const revokeReq = new NextRequest("http://localhost:3000/api/dev/entitlement", {
        method: "POST",
        body: JSON.stringify({ action: "revoke" }),
      });
      const revokeRes = await devPost(revokeReq);
      expect(revokeRes.status).toBe(200);
      const revokeData = await revokeRes.json();
      expect(revokeData.status).toBe("revoked");
      expect(revokeData.entitlement.tier).toBe("free");
    });

    it("/api/dev/entitlement POST returns 403 DEPRECATED in production", async () => {
      setNodeEnv("production");
      const req = new NextRequest("http://localhost:3000/api/dev/entitlement", {
        method: "POST",
        body: JSON.stringify({ action: "grant" }),
      });
      const res = await devPost(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe("DEPRECATED");
    });

    it("/api/entitlement/grant POST returns 403 DEPRECATED in production", async () => {
      setNodeEnv("production");
      const req = new NextRequest("http://localhost:3000/api/entitlement/grant", {
        method: "POST",
        body: JSON.stringify({ aid: "user1" }),
      });
      const res = await grantPost(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe("DEPRECATED");
    });

    it("/api/entitlement/me GET respects dev bypass in dev, rejects in production", async () => {
      // In dev mode
      setNodeEnv("development");
      const devReq = new NextRequest("http://localhost:3000/api/entitlement/me", {
        headers: { "x-dev-pro": "true" },
      });
      const devRes = await meGet(devReq);
      expect(devRes.status).toBe(200);
      const devData = await devRes.json();
      expect(devData.tier).toBe("pro");
      expect(devData.src).toBe("dev-override");

      // In production
      setNodeEnv("production");
      const prodReq = new NextRequest("http://localhost:3000/api/entitlement/me", {
        headers: { "x-dev-pro": "true" },
      });
      const prodRes = await meGet(prodReq);
      expect(prodRes.status).toBe(200);
      const prodData = await prodRes.json();
      // Dev bypass must NOT be honored in production
      expect(prodData.tier).toBe("free");
    });

    it("/api/entitlement/me GET rejects dev-override JWT token in production", async () => {
      setNodeEnv("development");
      const devEnt = createDevProEntitlement();
      const devToken = signEntitlementJwt(devEnt);

      // Now switch to production
      setNodeEnv("production");
      const req = new NextRequest("http://localhost:3000/api/entitlement/me", {
        headers: { authorization: `Bearer ${devToken}` },
      });
      const res = await meGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      // Must be rejected back to free entitlement
      expect(data.tier).toBe("free");
    });

    it("/api/pairing/issue rejects dev tokens in production, accepts in development", async () => {
      setNodeEnv("development");
      const devEnt = createDevProEntitlement();
      const devToken = signEntitlementJwt(devEnt);

      // In development: works
      const devReq = new NextRequest("http://localhost:3000/api/pairing/issue", {
        headers: { authorization: `Bearer ${devToken}` },
      });
      const devRes = await pairingIssuePost(devReq);
      expect(devRes.status).toBe(200);
      const devData = await devRes.json();
      expect(devData.code).toBeDefined();

      // In production: strictly forbidden
      setNodeEnv("production");
      const prodReq = new NextRequest("http://localhost:3000/api/pairing/issue", {
        headers: { authorization: `Bearer ${devToken}` },
      });
      const prodRes = await pairingIssuePost(prodReq);
      expect(prodRes.status).toBe(403);
      const prodData = await prodRes.json();
      expect(prodData.error).toBe("FORBIDDEN");
    });

    it("/api/pairing/redeem rejects dev entitlements in production, works in development", async () => {
      setNodeEnv("development");
      // First grant dev pro via dev route to write the row
      const grantReq = new NextRequest("http://localhost:3000/api/dev/entitlement", {
        method: "POST",
        body: JSON.stringify({ action: "grant" }),
      });
      const grantRes = await devPost(grantReq);
      const grantData = await grantRes.json();
      const token = grantData.token;

      // Issue a pairing code
      const issueReq = new NextRequest("http://localhost:3000/api/pairing/issue", {
        headers: { authorization: `Bearer ${token}` },
      });
      const issueRes = await pairingIssuePost(issueReq);
      const issueData = await issueRes.json();

      // In production: redeem must fail closed
      setNodeEnv("production");
      const prodRedeemReq = new NextRequest("http://localhost:3000/api/pairing/redeem", {
        method: "POST",
        body: JSON.stringify({ code: issueData.code, device_aid: "android-prod-test" }),
      });
      const prodRedeemRes = await pairingRedeemPost(prodRedeemReq);
      expect(prodRedeemRes.status).toBe(403);

      // Re-issue code for dev redeem test
      setNodeEnv("development");
      const issueReq2 = new NextRequest("http://localhost:3000/api/pairing/issue", {
        headers: { authorization: `Bearer ${token}` },
      });
      const issueRes2 = await pairingIssuePost(issueReq2);
      const issueData2 = await issueRes2.json();

      // In development: redeem succeeds
      const devRedeemReq = new NextRequest("http://localhost:3000/api/pairing/redeem", {
        method: "POST",
        body: JSON.stringify({ code: issueData2.code, device_aid: "android-dev-test" }),
      });
      const devRedeemRes = await pairingRedeemPost(devRedeemReq);
      expect(devRedeemRes.status).toBe(200);
      const devRedeemData = await devRedeemRes.json();
      expect(devRedeemData.tier).toBe("pro");
      expect(devRedeemData.aid).toBe(DEV_PRO_AID);
    });

    it("/api/entitlement/refresh rejects dev tokens in production", async () => {
      setNodeEnv("development");
      const devEnt = createDevProEntitlement();
      const devToken = signEntitlementJwt(devEnt);

      setNodeEnv("production");
      const req = new NextRequest("http://localhost:3000/api/entitlement/refresh", {
        method: "POST",
        body: JSON.stringify({ mirror: devToken }),
      });
      const res = await refreshPost(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe("DEPRECATED");
    });

    it("/api/entitlement/restore rejects dev rows in production", async () => {
      setNodeEnv("development");
      // Grant dev entitlement to populate row
      const grantReq = new NextRequest("http://localhost:3000/api/dev/entitlement", {
        method: "POST",
        body: JSON.stringify({ action: "grant" }),
      });
      await devPost(grantReq);

      // In production, restore must return free entitlement
      setNodeEnv("production");
      const req = new NextRequest("http://localhost:3000/api/entitlement/restore", {
        method: "POST",
        body: JSON.stringify({ aid: DEV_PRO_AID }),
      });
      const res = await restorePost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("not_found");
      expect(data.entitlement.tier).toBe("free");
    });

    it("/api/dev/entitlement sets tf_ent cookie on grant and clears on revoke", async () => {
      setNodeEnv("development");
      const grantReq = new NextRequest("http://localhost:3000/api/dev/entitlement", {
        method: "POST",
        body: JSON.stringify({ action: "grant" }),
      });
      const grantRes = await devPost(grantReq);
      const cookieHeader = grantRes.headers.get("set-cookie");
      expect(cookieHeader).toContain("tf_ent=");

      const revokeReq = new NextRequest("http://localhost:3000/api/dev/entitlement", {
        method: "POST",
        body: JSON.stringify({ action: "revoke" }),
      });
      const revokeRes = await devPost(revokeReq);
      const revokeCookieHeader = revokeRes.headers.get("set-cookie");
      expect(revokeCookieHeader).toContain("tf_ent=");
      expect(revokeCookieHeader).toContain("Max-Age=0");
    });
  });
});
