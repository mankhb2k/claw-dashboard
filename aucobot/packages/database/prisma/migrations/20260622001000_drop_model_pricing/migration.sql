-- Model pricing moved to a bundled static catalog in apps/api.
-- Cost is snapshotted onto model_usage_events.cost_usd at record time.
DROP TABLE IF EXISTS "model_pricing";
