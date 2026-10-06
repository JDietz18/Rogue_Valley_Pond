# Rogue Valley Ponds & Handyman

Website for Robert's veteran-owned pond, water feature, koi and handyman business in Grants Pass, Oregon (est. 2021).

| Path | What it is |
| --- | --- |
| `site/` | The landing page: `index.html`, `styles.css`, `app.js`, `config.js` (Supabase settings and phone), `assets/` (logo and icons) |
| `supabase/migrations/` | Database for quote requests |
| `scripts/build_share.py` | Builds `share/rogue-valley-ponds.html`, the whole page as one file |
| `share/` | The single-file page, for sending or uploading |

## Quote requests

The form saves to the `quote_requests` table in the Supabase project **rogue-valley-pond** (us-west-1). Read them in the Supabase dashboard under Table Editor → `quote_requests`; the `status` column (new, contacted, quoted, won, lost) is there for keeping track.

The page's publishable key can only submit a request through `submit_quote_request()`. It can't read the table, and the function turns away more than five requests an hour from one phone number. If the form can't reach the database, it shows Robert's number and a button that copies the customer's request so they can text it.

## Editing

- Phone and Supabase settings: `site/config.js`
- Services, service area and wording: `site/index.html`
- Pond calendar months and tips: the "pond year" section in `site/index.html` and `SEASON_TEXT` in `site/app.js`

Run `python3 scripts/build_share.py` after changes to refresh the single-file page.

## Still to confirm

- The services list and service-area towns are typical placeholders; edit them to what Robert actually does.
- No public web address yet; Facebook link previews need one (see the comment in `site/index.html`).
