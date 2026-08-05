-- Index the denormalized score so the `?sort=top` feed (ORDER BY score DESC) is index-backed.
CREATE INDEX "Post_score_idx" ON "Post"("score");
