-- Make username uniqueness case-insensitive.
--
-- Profile.username is `String @unique`, which Postgres enforces byte-for-byte. That let "alice" and
-- "Alice" coexist as two separate accounts. Harmless while usernames were only a label; not harmless
-- now that they are the profile URL (/u/:username) and the thing readers use to tell one author from
-- another. Two accounts whose names differ only in case is an impersonation vector on a forum.
--
-- Prisma's schema language cannot express an index on an expression, so this is hand-written. The
-- plain @unique on username stays (it backs findUnique and is still a real constraint); this adds a
-- second, stricter one on the folded value.
--
-- Written as a migration rather than left to the service's pre-insert check because that check is a
-- read followed by a write: two simultaneous signups for "alice" and "Alice" would both pass it. The
-- database is the only place a uniqueness rule actually holds.

-- Fold any existing collision before adding the constraint, or the CREATE fails on live data. There
-- are none in this project's data today, so this is here for the general case: keep the oldest row's
-- name and suffix the rest, oldest-first, so the result is deterministic.
WITH ranked AS (
    SELECT
        "id",
        "username",
        ROW_NUMBER() OVER (PARTITION BY lower("username") ORDER BY "createdAt", "id") AS rn
    FROM "Profile"
)
UPDATE "Profile" AS p
SET "username" = ranked."username" || '_' || (ranked.rn - 1)::text
FROM ranked
WHERE p."id" = ranked."id"
  AND ranked.rn > 1;

CREATE UNIQUE INDEX "Profile_username_lower_key" ON "Profile" (lower("username"));
