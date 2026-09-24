-- Close the Supabase Data API's door on these tables, in source rather than by platform default.
--
-- Supabase serves every table in the `public` schema over PostgREST at /rest/v1/, authorized by the
-- publishable key that the browser bundle necessarily carries. Two things keep that from being a way
-- around the API's auth and ownership checks: row level security on each table, and the privileges
-- granted to the `anon` and `authenticated` roles. Tables created through Supabase's UI get RLS
-- automatically; tables created by these migrations did too, but only because the platform defaulted
-- that way — nothing here asked for it. Run this schema against a fresh project or a plain Postgres
-- and that protection would not come with it.
--
-- So state it explicitly. ENABLE ROW LEVEL SECURITY is a no-op where it is already on, and with no
-- policies defined it denies every row to anyone who is not the table owner. The REVOKE is the part
-- that still changes something: it removes the privileges outright, so the tables stay shut even if
-- RLS is later switched off on one of them.
--
-- The API is unaffected: it connects as the owning role over DATABASE_URL, and RLS does not apply to
-- a table's owner unless FORCE ROW LEVEL SECURITY is set, which is deliberately NOT used here —
-- forcing it would lock the application out of its own tables.
--
-- (`_prisma_migrations` is left alone: it is Prisma's bookkeeping, it holds no user data, and it is
-- not ours to restrict.)

ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Community" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PostVote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommentVote" ENABLE ROW LEVEL SECURITY;

-- `anon` and `authenticated` are Supabase's roles and do not exist on a plain Postgres, which is
-- what the test suite and CI run against — so revoke only where they are actually present, keeping
-- this migration portable.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON "Profile", "Post", "Comment", "Community", "PostVote", "CommentVote"
            FROM anon;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON "Profile", "Post", "Comment", "Community", "PostVote", "CommentVote"
            FROM authenticated;
    END IF;
END
$$;
