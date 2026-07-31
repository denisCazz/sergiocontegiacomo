/**
 * Optional helper notes for dumping data from Supabase Postgres into VPS Postgres.
 *
 * Preferred (if you still have DB access to Supabase):
 *   pg_dump --data-only --no-owner \
 *     -t articles -t events -t comments -t event_rsvps \
 *     -t audio_pillole -t press -t podcasts -t testimonials \
 *     "$SUPABASE_DB_URL" > data.sql
 *
 * Then on VPS (after sql/schema.sql):
 *   psql "$DATABASE_URL" -f data.sql
 *
 * Afterwards run:
 *   node --env-file=.env scripts/migrate-media-to-r2.mjs
 */
console.log('See comments in this file for pg_dump / psql migration steps.');
