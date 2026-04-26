-- Default Free & Pro plans (values aligned with prisma/seed.ts).
-- Runs with `prisma migrate deploy` (e.g. Docker CMD) so production-like environments
-- do not need a separate `prisma db seed` step.
INSERT INTO "plans" (
  "id",
  "name",
  "maxProjects",
  "ramMb",
  "cpuVcpu",
  "storageGb",
  "heavyJobsPerDay",
  "idleTimeoutMin",
  "priceMonthly"
)
VALUES
  (
    'cmj4openclawbaselinepfree',
    'free',
    1,
    1024,
    0.5,
    4,
    0,
    10,
    0
  ),
  (
    'cmj4openclawbaselineppro0',
    'pro',
    10,
    2048,
    1.0,
    100,
    100,
    60,
    2999
  )
ON CONFLICT ("name") DO NOTHING;
