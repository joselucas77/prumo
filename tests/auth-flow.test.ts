import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { signJwtToken, verifyJwtToken } from "@/lib/jwt-auth";

describe("Authentication Logic & Security", () => {
  it("should securely hash and compare passwords", async () => {
    const password = "minhasenhafidelidade123";
    const hashed = await bcrypt.hash(password, 10);

    expect(hashed).not.toBe(password);
    expect(await bcrypt.compare(password, hashed)).toBe(true);
    expect(await bcrypt.compare("senhaerrada", hashed)).toBe(false);
  });

  it("should generate and verify valid JWT tokens", async () => {
    const payload = {
      sub: "usr_test_12345",
      tenantId: "ten_test_67890",
      email: "teste@prumo.app",
      scope: "user" as const,
    };

    const token = await signJwtToken(payload, "1h");
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const verified = await verifyJwtToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe(payload.sub);
    expect(verified?.tenantId).toBe(payload.tenantId);
    expect(verified?.email).toBe(payload.email);
  });

  it("should reject tampered or invalid JWT tokens", async () => {
    const token = await signJwtToken({ sub: "usr_123", tenantId: "ten_123" });
    const tampered = token.slice(0, -6) + "abcdef";

    const verified = await verifyJwtToken(tampered);
    expect(verified).toBeNull();
  });
});
