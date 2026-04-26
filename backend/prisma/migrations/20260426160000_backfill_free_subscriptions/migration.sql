-- One ACTIVE subscription per user on the free plan (users without a row only).
INSERT INTO "subscriptions" (
  "id",
  "userId",
  "planId",
  "status",
  "currentPeriodStart",
  "createdAt",
  "updatedAt"
)
SELECT
  'cm' || replace(gen_random_uuid()::text, '-', '') AS "id",
  u.id AS "userId",
  p.id AS "planId",
  'ACTIVE'::"SubscriptionStatus" AS "status",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "users" u
CROSS JOIN (SELECT id FROM "plans" WHERE name = 'free' LIMIT 1) p
WHERE NOT EXISTS (SELECT 1 FROM "subscriptions" s WHERE s."userId" = u.id);
