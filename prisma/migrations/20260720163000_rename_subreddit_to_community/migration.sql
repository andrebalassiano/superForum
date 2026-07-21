-- Rename Subreddit -> Community, preserving all existing rows.
-- Hand-written as ALTER ... RENAME (instead of Prisma's default drop/recreate)
-- so the data survives and constraint/index names match Prisma's naming convention.

-- 1. Rename the table.
ALTER TABLE "Subreddit" RENAME TO "Community";

-- 2. Rename the table's constraints/indexes to the new naming convention.
ALTER TABLE "Community" RENAME CONSTRAINT "Subreddit_pkey" TO "Community_pkey";
ALTER INDEX "Subreddit_name_key" RENAME TO "Community_name_key";

-- 3. Rename the foreign-key column on Post.
ALTER TABLE "Post" RENAME COLUMN "subredditId" TO "communityId";

-- 4. Rename Post's FK constraint and index that referenced the old column name.
ALTER TABLE "Post" RENAME CONSTRAINT "Post_subredditId_fkey" TO "Post_communityId_fkey";
ALTER INDEX "Post_subredditId_idx" RENAME TO "Post_communityId_idx";
