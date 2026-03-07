-- Performance indexes for high-traffic API filters/order-by paths

CREATE INDEX IF NOT EXISTS "ActorAction_actorId_date_idx"
ON "ActorAction"("actorId", "date" DESC);

CREATE INDEX IF NOT EXISTS "MapFeature_conflictId_timestamp_idx"
ON "MapFeature"("conflictId", "timestamp");

CREATE INDEX IF NOT EXISTS "MapFeature_conflictId_featureType_timestamp_idx"
ON "MapFeature"("conflictId", "featureType", "timestamp");

CREATE INDEX IF NOT EXISTS "XPost_conflictId_accountType_timestamp_idx"
ON "XPost"("conflictId", "accountType", "timestamp" DESC);

CREATE INDEX IF NOT EXISTS "XPost_conflictId_significance_timestamp_idx"
ON "XPost"("conflictId", "significance", "timestamp" DESC);
