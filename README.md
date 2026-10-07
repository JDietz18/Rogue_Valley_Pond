# Rogue Valley Ponds & Handyman

Website for Robert's veteran-owned pond, water feature, koi and handyman business in Grants Pass, Oregon (est. 2021). Built on the v3 identity: the koi badge's colors set on black (Nocturne design system), with Big Shoulders Display for headlines, Big Shoulders Stencil Display for the veteran labels and numbers, and Inter for running text.

| Path | What it is |
| --- | --- |
| `site/index.html` | Landing page: animated koi badge, pond and handyman services, recent work, pond year, how it works, service area |
| `site/quote.html` | Request a Quote. `quote.html?job=pond\|water-feature\|pond-care\|koi\|handyman\|not-sure` preselects the job type |
| `site/assets/css/` | `nocturne.css` (design system), `site.css` (identity and layout), `icons.css` (Phosphor subset) |
| `site/assets/js/` | `config.js` (Supabase settings and phone), `site.js` (phone links, photos, animated badge, pond year), `quote.js` (the form) |
| `site/assets/photos/` | Job and koi photos, resized to 1600px max |
| `site/assets/img/`, `site/assets/video/` | Koi badge for the header and footer (`rvph-badge-*.webp`), browser-tab and home-screen icons, link-preview image (`og-image.jpg`), animated badge (MP4 + WebM) |
| `site/favicon.ico` | Tab icon for browsers that look for it at the site root |
| `supabase/migrations/` | Database for quote requests |
| `scripts/build_share.py` | Builds `share/rogue-valley-ponds.html`, the landing page as one file |
| `share/` | The single-file page, for sending or uploading |

No build step. Host the `site/` folder on any static host (Netlify, Cloudflare Pages, GitHub Pages).

## Type, veteran theme and motion

- Fonts load from one Google Fonts link in each page's `<head>`; `site.css` names them `--font-display`, `--font-stencil` and `--font-body`.
- Veteran presence: the service ribbon above the header (both pages), the stencil "Veteran owned & operated" line in the hero and on the quote page, the "A veteran's word, in writing" section after the hero (`#veteran`), stencil step numbers, and the rotating seal in the footer. Colors stay the logo's own: red, cream, Pond Blue, brass stars.
- Motion only runs with JavaScript on and never under "reduce motion". A one-line script in each `<head>` adds `js` to `<html>`; `site.js` adds `is-ready` when the page is up, which plays the hero entrance. Section heads, the four commitments and the steps reveal as they scroll in (browsers without scroll timelines show them straight away). Without JavaScript everything is simply visible.

## Quote requests

The form saves to the `quote_requests` table in the Supabase project **rogue-valley-pond** (us-west-1). Read them in the Supabase dashboard under Table Editor → `quote_requests`; the `status` column (new, contacted, quoted, won, lost) is there for keeping track.

The page's publishable key can only submit a request through `submit_quote_request()`. It can't read the table, and the function turns away more than five requests an hour from one phone number. If the form can't reach the database, it shows Robert's number and a button that copies the customer's request so they can text it.

## Editing

- Logo: every badge image is rendered from the high-detail vector (`Rogue_Valley_High_Detail_Vector_v2.svg`, kept outside the repo; it is 65 MB). Re-render from it if the logo changes.
- Phone and Supabase settings: `site/assets/js/config.js`
- Services, service area and wording: `site/index.html`
- Pond calendar months and tips: the "pond year" section in `site/index.html` and `SEASON_TEXT` in `site/assets/js/site.js`
- Photos: replace a file in `site/assets/photos/` with the same name. If one is missing, its slot shows a labeled placeholder instead of a broken image.
- Icons: `icons.css` holds only the icons in use. To add one, copy its rule from [Phosphor](https://phosphoricons.com) (`@phosphor-icons/web` 2.1.1, regular).

Run `python3 scripts/build_share.py` after changes to refresh the single-file page. That copy shows the still badge instead of the animation.

## Still to confirm

- The services list and service-area towns are typical placeholders; edit them to what Robert actually does.
- No public web address yet. Facebook link previews need `og:image` to be a full URL (e.g. `https://example.com/assets/img/og-image.jpg`) once the site has one.
