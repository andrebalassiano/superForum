-- Drop the redundant client-supplied `timestamp` column on posts and comments.
-- `createdAt` (server-set, @default(now())) is the single source of truth for when a row was made.
ALTER TABLE "Post" DROP COLUMN "timestamp";
ALTER TABLE "Comment" DROP COLUMN "timestamp";
