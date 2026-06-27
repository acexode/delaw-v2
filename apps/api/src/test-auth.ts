import { buildServer } from "./server";

// Standalone smoke test: registers a fresh user and logs in, exercising the
// full auth path (DB writes, password hashing, JWT issuance, refresh cookie)
// without a UI. Uses Fastify's light injection — no network/port needed.
//
//   pnpm --filter @delaw/api test:auth   (DATABASE_URL must point at the DB)

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function main(): Promise<void> {
  const app = await buildServer();

  const stamp = Date.now();
  const email = `test+${stamp}@delaw.africa`;
  const password = "TestPass123!";

  // 1. Register --------------------------------------------------------------
  const registerRes = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      email,
      password,
      fullName: "Test Partner",
      organisationName: `Test Chambers ${stamp}`,
      organisationType: "LAW_FIRM",
      plan: "SOLO",
    },
  });

  assert(
    registerRes.statusCode === 201,
    `register expected 201, got ${registerRes.statusCode}: ${registerRes.body}`,
  );
  const registerBody = registerRes.json();
  assert(registerBody.accessToken, "register should return an accessToken");
  assert(registerBody.user.role === "PARTNER", "first user should be PARTNER");
  const registerCookie = registerRes.cookies.find(
    (c) => c.name === "refresh_token",
  );
  assert(registerCookie, "register should set a refresh_token cookie");
  assert(registerCookie?.httpOnly, "refresh cookie must be httpOnly");

  // eslint-disable-next-line no-console
  console.log(`[ok] registered ${email} (org: ${registerBody.organisation.slug})`);

  // 2. Duplicate registration should be rejected -----------------------------
  const dupRes = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      email,
      password,
      fullName: "Test Partner",
      organisationName: "Another Firm",
    },
  });
  assert(
    dupRes.statusCode === 409,
    `duplicate register expected 409, got ${dupRes.statusCode}`,
  );
  // eslint-disable-next-line no-console
  console.log("[ok] duplicate email rejected (409)");

  // 3. Login -----------------------------------------------------------------
  const loginRes = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email, password },
  });
  assert(
    loginRes.statusCode === 200,
    `login expected 200, got ${loginRes.statusCode}: ${loginRes.body}`,
  );
  const loginBody = loginRes.json();
  assert(loginBody.accessToken, "login should return an accessToken");
  const loginCookie = loginRes.cookies.find((c) => c.name === "refresh_token");
  assert(loginCookie, "login should set a refresh_token cookie");
  // eslint-disable-next-line no-console
  console.log("[ok] logged in, received access token + refresh cookie");

  // 4. Wrong password should fail --------------------------------------------
  const badLoginRes = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email, password: "wrong-password" },
  });
  assert(
    badLoginRes.statusCode === 401,
    `bad login expected 401, got ${badLoginRes.statusCode}`,
  );
  // eslint-disable-next-line no-console
  console.log("[ok] wrong password rejected (401)");

  // 5. Refresh rotates the token ---------------------------------------------
  const refreshRes = await app.inject({
    method: "POST",
    url: "/api/v1/auth/refresh",
    cookies: { refresh_token: loginCookie!.value },
  });
  assert(
    refreshRes.statusCode === 200,
    `refresh expected 200, got ${refreshRes.statusCode}: ${refreshRes.body}`,
  );
  assert(refreshRes.json().accessToken, "refresh should return a new access token");
  // eslint-disable-next-line no-console
  console.log("[ok] refresh rotated the session");

  await app.close();
  // eslint-disable-next-line no-console
  console.log("\nAll auth smoke tests passed.");
  process.exit(0);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("\nAuth smoke test failed:\n", error);
  process.exit(1);
});
