-- CreateEnum
CREATE TYPE "ThreatLevel" AS ENUM ('CRITICAL', 'HIGH', 'ELEVATED', 'MONITORING');

-- CreateEnum
CREATE TYPE "ConflictStatus" AS ENUM ('ONGOING', 'PAUSED', 'CEASEFIRE', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('STATE', 'NON_STATE', 'ORGANIZATION', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('CRITICAL', 'HIGH', 'ELEVATED', 'MODERATE');

-- CreateEnum
CREATE TYPE "Stance" AS ENUM ('AGGRESSOR', 'DEFENDER', 'RETALIATING', 'PROXY', 'NEUTRAL', 'CONDEMNING');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('MILITARY', 'DIPLOMATIC', 'POLITICAL', 'ECONOMIC', 'INTELLIGENCE');

-- CreateEnum
CREATE TYPE "ActionSignificance" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'HIGH', 'STANDARD');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MILITARY', 'DIPLOMATIC', 'INTELLIGENCE', 'ECONOMIC', 'HUMANITARIAN', 'POLITICAL');

-- CreateEnum
CREATE TYPE "ActorResponseStance" AS ENUM ('SUPPORTING', 'OPPOSING', 'NEUTRAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SignificanceLevel" AS ENUM ('BREAKING', 'HIGH', 'STANDARD');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('military', 'government', 'journalist', 'analyst', 'official');

-- CreateEnum
CREATE TYPE "Perspective" AS ENUM ('WESTERN', 'US_GOV', 'ISRAELI', 'IRANIAN', 'ARAB', 'RUSSIAN', 'CHINESE', 'INDEPENDENT', 'INTL_ORG');

-- CreateEnum
CREATE TYPE "EconCategory" AS ENUM ('ENERGY', 'SAFE_HAVEN', 'EQUITIES', 'VOLATILITY', 'CURRENCY', 'DEFENSE', 'SHIPPING');

-- CreateEnum
CREATE TYPE "MapFeatureType" AS ENUM ('STRIKE_ARC', 'MISSILE_TRACK', 'TARGET', 'ASSET', 'THREAT_ZONE', 'HEAT_POINT');

-- CreateEnum
CREATE TYPE "StoryCategory" AS ENUM ('STRIKE', 'RETALIATION', 'NAVAL', 'INTEL', 'DIPLOMATIC');

-- CreateEnum
CREATE TYPE "StoryEventType" AS ENUM ('STRIKE', 'RETALIATION', 'INTEL', 'NAVAL', 'POLITICAL');

-- CreateTable
CREATE TABLE "Conflict" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "codename" JSONB NOT NULL,
    "status" "ConflictStatus" NOT NULL,
    "threatLevel" "ThreatLevel",
    "startDate" DATE NOT NULL,
    "region" TEXT NOT NULL,
    "escalation" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "keyFacts" TEXT[],
    "objectives" JSONB NOT NULL,
    "commanders" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConflictDaySnapshot" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "dayLabel" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyFacts" TEXT[],
    "escalation" INTEGER NOT NULL,
    "economicNarrative" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConflictDaySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CasualtySummary" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "faction" TEXT NOT NULL,
    "killed" INTEGER NOT NULL DEFAULT 0,
    "wounded" INTEGER NOT NULL DEFAULT 0,
    "civilians" INTEGER NOT NULL DEFAULT 0,
    "injured" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CasualtySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EconomicImpactChip" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "ord" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "val" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "EconomicImpactChip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "ord" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "prob" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actor" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "countryCode" TEXT,
    "type" "ActorType" NOT NULL,
    "activityLevel" "ActivityLevel" NOT NULL,
    "activityScore" INTEGER NOT NULL,
    "stance" "Stance" NOT NULL,
    "saying" TEXT NOT NULL,
    "doing" TEXT[],
    "assessment" TEXT NOT NULL,
    "keyFigures" TEXT[],
    "linkedEventIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActorDaySnapshot" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "activityLevel" "ActivityLevel" NOT NULL,
    "activityScore" INTEGER NOT NULL,
    "stance" "Stance" NOT NULL,
    "saying" TEXT NOT NULL,
    "doing" TEXT[],
    "assessment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActorDaySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActorAction" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" "ActionType" NOT NULL,
    "description" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "significance" "ActionSignificance" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActorAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelEvent" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "severity" "Severity" NOT NULL,
    "type" "EventType" NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "fullContent" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntelEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSource" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "reliability" INTEGER NOT NULL,
    "url" TEXT,

    CONSTRAINT "EventSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventActorResponse" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "stance" "ActorResponseStance" NOT NULL,
    "type" TEXT NOT NULL,
    "statement" TEXT NOT NULL,

    CONSTRAINT "EventActorResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XPost" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "avatarColor" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "accountType" "AccountType" NOT NULL,
    "significance" "SignificanceLevel" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "videoThumb" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "retweets" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "pharosNote" TEXT,
    "eventId" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "XPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapFeature" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "featureType" "MapFeatureType" NOT NULL,
    "actor" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT,
    "timestamp" TIMESTAMP(3),
    "geometry" JSONB NOT NULL,
    "properties" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapStory" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "iconName" TEXT NOT NULL,
    "category" "StoryCategory" NOT NULL,
    "narrative" TEXT NOT NULL,
    "highlightStrikeIds" TEXT[],
    "highlightMissileIds" TEXT[],
    "highlightTargetIds" TEXT[],
    "highlightAssetIds" TEXT[],
    "viewState" JSONB NOT NULL,
    "keyFacts" TEXT[],
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapStoryEvent" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "ord" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "StoryEventType" NOT NULL,

    CONSTRAINT "MapStoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RssFeed" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "perspective" "Perspective" NOT NULL,
    "country" TEXT NOT NULL,
    "tags" TEXT[],
    "stateFunded" BOOLEAN NOT NULL DEFAULT false,
    "tier" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RssFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConflictCollection" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConflictCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConflictChannel" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "perspective" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "ord" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConflictChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelFeed" (
    "channelId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "ord" INTEGER NOT NULL,

    CONSTRAINT "ChannelFeed_pkey" PRIMARY KEY ("channelId","feedId")
);

-- CreateTable
CREATE TABLE "EconomicIndex" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "category" "EconCategory" NOT NULL,
    "tier" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EconomicIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionGroup" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "bg" TEXT NOT NULL,
    "border" TEXT NOT NULL,
    "titleMatches" TEXT[],
    "ord" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConflictDaySnapshot_conflictId_day_idx" ON "ConflictDaySnapshot"("conflictId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "ConflictDaySnapshot_conflictId_day_key" ON "ConflictDaySnapshot"("conflictId", "day");

-- CreateIndex
CREATE INDEX "CasualtySummary_snapshotId_idx" ON "CasualtySummary"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "CasualtySummary_snapshotId_faction_key" ON "CasualtySummary"("snapshotId", "faction");

-- CreateIndex
CREATE INDEX "EconomicImpactChip_snapshotId_idx" ON "EconomicImpactChip"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "EconomicImpactChip_snapshotId_ord_key" ON "EconomicImpactChip"("snapshotId", "ord");

-- CreateIndex
CREATE INDEX "Scenario_snapshotId_idx" ON "Scenario"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "Scenario_snapshotId_ord_key" ON "Scenario"("snapshotId", "ord");

-- CreateIndex
CREATE INDEX "Actor_conflictId_idx" ON "Actor"("conflictId");

-- CreateIndex
CREATE INDEX "ActorDaySnapshot_actorId_day_idx" ON "ActorDaySnapshot"("actorId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "ActorDaySnapshot_actorId_day_key" ON "ActorDaySnapshot"("actorId", "day");

-- CreateIndex
CREATE INDEX "ActorAction_actorId_idx" ON "ActorAction"("actorId");

-- CreateIndex
CREATE INDEX "IntelEvent_conflictId_timestamp_idx" ON "IntelEvent"("conflictId", "timestamp");

-- CreateIndex
CREATE INDEX "IntelEvent_severity_idx" ON "IntelEvent"("severity");

-- CreateIndex
CREATE INDEX "IntelEvent_type_idx" ON "IntelEvent"("type");

-- CreateIndex
CREATE INDEX "EventSource_eventId_idx" ON "EventSource"("eventId");

-- CreateIndex
CREATE INDEX "EventActorResponse_eventId_idx" ON "EventActorResponse"("eventId");

-- CreateIndex
CREATE INDEX "EventActorResponse_actorId_idx" ON "EventActorResponse"("actorId");

-- CreateIndex
CREATE INDEX "XPost_conflictId_timestamp_idx" ON "XPost"("conflictId", "timestamp");

-- CreateIndex
CREATE INDEX "XPost_significance_idx" ON "XPost"("significance");

-- CreateIndex
CREATE INDEX "XPost_accountType_idx" ON "XPost"("accountType");

-- CreateIndex
CREATE INDEX "XPost_eventId_idx" ON "XPost"("eventId");

-- CreateIndex
CREATE INDEX "XPost_actorId_idx" ON "XPost"("actorId");

-- CreateIndex
CREATE INDEX "MapFeature_conflictId_featureType_idx" ON "MapFeature"("conflictId", "featureType");

-- CreateIndex
CREATE INDEX "MapFeature_actor_idx" ON "MapFeature"("actor");

-- CreateIndex
CREATE INDEX "MapFeature_timestamp_idx" ON "MapFeature"("timestamp");

-- CreateIndex
CREATE INDEX "MapStory_conflictId_timestamp_idx" ON "MapStory"("conflictId", "timestamp");

-- CreateIndex
CREATE INDEX "MapStoryEvent_storyId_idx" ON "MapStoryEvent"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "MapStoryEvent_storyId_ord_key" ON "MapStoryEvent"("storyId", "ord");

-- CreateIndex
CREATE INDEX "ConflictCollection_conflictId_idx" ON "ConflictCollection"("conflictId");

-- CreateIndex
CREATE INDEX "ConflictChannel_collectionId_idx" ON "ConflictChannel"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ConflictChannel_collectionId_ord_key" ON "ConflictChannel"("collectionId", "ord");

-- CreateIndex
CREATE INDEX "ChannelFeed_feedId_idx" ON "ChannelFeed"("feedId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelFeed_channelId_ord_key" ON "ChannelFeed"("channelId", "ord");

-- CreateIndex
CREATE INDEX "EconomicIndex_category_idx" ON "EconomicIndex"("category");

-- CreateIndex
CREATE INDEX "EconomicIndex_tier_idx" ON "EconomicIndex"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "PredictionGroup_ord_key" ON "PredictionGroup"("ord");

-- AddForeignKey
ALTER TABLE "ConflictDaySnapshot" ADD CONSTRAINT "ConflictDaySnapshot_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasualtySummary" ADD CONSTRAINT "CasualtySummary_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ConflictDaySnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EconomicImpactChip" ADD CONSTRAINT "EconomicImpactChip_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ConflictDaySnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ConflictDaySnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actor" ADD CONSTRAINT "Actor_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActorDaySnapshot" ADD CONSTRAINT "ActorDaySnapshot_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActorAction" ADD CONSTRAINT "ActorAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntelEvent" ADD CONSTRAINT "IntelEvent_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSource" ADD CONSTRAINT "EventSource_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "IntelEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventActorResponse" ADD CONSTRAINT "EventActorResponse_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "IntelEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventActorResponse" ADD CONSTRAINT "EventActorResponse_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XPost" ADD CONSTRAINT "XPost_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XPost" ADD CONSTRAINT "XPost_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "IntelEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XPost" ADD CONSTRAINT "XPost_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapFeature" ADD CONSTRAINT "MapFeature_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapStory" ADD CONSTRAINT "MapStory_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapStoryEvent" ADD CONSTRAINT "MapStoryEvent_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "MapStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConflictCollection" ADD CONSTRAINT "ConflictCollection_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConflictChannel" ADD CONSTRAINT "ConflictChannel_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ConflictCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelFeed" ADD CONSTRAINT "ChannelFeed_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "ConflictChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelFeed" ADD CONSTRAINT "ChannelFeed_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "RssFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;
