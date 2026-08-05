-- Denormalized aggregate vote score on posts and comments, maintained transactionally by the
-- vote handlers. Backfill from the existing votes so current rows are correct.
ALTER TABLE "Post" ADD COLUMN "score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Comment" ADD COLUMN "score" INTEGER NOT NULL DEFAULT 0;

UPDATE "Post"
SET "score" = COALESCE((SELECT SUM("value") FROM "PostVote" WHERE "PostVote"."postId" = "Post"."id"), 0);

UPDATE "Comment"
SET "score" = COALESCE((SELECT SUM("value") FROM "CommentVote" WHERE "CommentVote"."commentId" = "Comment"."id"), 0);
