import "dotenv/config";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { db, organisations, users } from "@delaw/db";

// Local-dev seed: one demo organisation + one partner user.
//   email:    demo@delaw.africa
//   password: DeLaw2025!
// Idempotent — safe to run repeatedly (skips rows that already exist).

const DEMO_ORG_SLUG = "demo";
const DEMO_USER_EMAIL = "demo@delaw.africa";
const DEMO_USER_PASSWORD = "DeLaw2025!";
const BCRYPT_COST = 12; // spec §8.1

async function main() {
  await db
    .insert(organisations)
    .values({
      name: "DeLaw Demo Chambers",
      slug: DEMO_ORG_SLUG,
      type: "LAW_FIRM",
      plan: "PROFESSIONAL",
      planStatus: "TRIALING",
      country: "NG",
      aiCreditsQuota: 500,
    })
    .onConflictDoNothing({ target: organisations.slug });

  const [org] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.slug, DEMO_ORG_SLUG))
    .limit(1);

  if (!org) {
    throw new Error("Failed to create or find demo organisation");
  }

  const passwordHash = await bcrypt.hash(DEMO_USER_PASSWORD, BCRYPT_COST);

  await db
    .insert(users)
    .values({
      organisationId: org.id,
      email: DEMO_USER_EMAIL,
      passwordHash,
      fullName: "Demo Partner",
      displayName: "Demo Partner",
      role: "PARTNER",
      jurisdictions: ["NG"],
      isActive: true,
      onboardingComplete: true,
    })
    .onConflictDoNothing({ target: users.email });

  // eslint-disable-next-line no-console
  console.log(
    `Seed complete.\n  org:  DeLaw Demo Chambers (slug: ${DEMO_ORG_SLUG})\n  user: ${DEMO_USER_EMAIL} / ${DEMO_USER_PASSWORD}`,
  );

  process.exit(0);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed:", error);
  process.exit(1);
});
