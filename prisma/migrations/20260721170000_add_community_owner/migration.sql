-- Add community ownership. Existing rows predate the concept, so add the column nullable first,
-- backfill to the sole existing user, then enforce NOT NULL + the foreign key. Hand-written
-- (instead of Prisma's default) because a straight NOT NULL column can't be added to a populated table.

-- 1. Add the column, nullable for now so existing rows are allowed.
ALTER TABLE "Community" ADD COLUMN "ownerId" UUID;

-- 2. Backfill existing communities to the only real profile (andre). One-time data migration.
UPDATE "Community" SET "ownerId" = '8f553285-9fa2-4ff4-abf1-5f14cd66a16f' WHERE "ownerId" IS NULL;

-- 3. Every row now has an owner — enforce NOT NULL to match the schema.
ALTER TABLE "Community" ALTER COLUMN "ownerId" SET NOT NULL;

-- 4. Index the FK column (matches Prisma's @@index([ownerId])).
CREATE INDEX "Community_ownerId_idx" ON "Community"("ownerId");

-- 5. Foreign key to Profile; RESTRICT on delete so a profile that still owns communities can't be removed.
ALTER TABLE "Community" ADD CONSTRAINT "Community_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;