# Rogue Valley Ponds & Handyman

Website for Robert's veteran-owned pond, water feature, koi and handyman business in Grants Pass, Oregon (est. 2021). Built on the v3 identity: the koi badge's colors set on black (Nocturne design system), with Big Shoulders Display for headlines, Big Shoulders Stencil Display for the veteran labels and numbers, and Inter for running text.

| Path | What it is |
| --- | --- |
| `site/index.html` | Landing page: animated koi badge, pond and handyman services, recent work, pond year, how it works, service area |
| `site/quote.html` | Request a Quote. `quote.html?job=pond\|water-feature\|pond-care\|koi\|handyman\|not-sure` preselects the job type |
| `site/assets/css/` | `nocturne.css` (design system), `site.css` (identity and layout), `icons.css` (Phosphor subset), `splash.css` (landing intro) |
| `site/assets/js/` | `config.js` (Supabase settings and phone), `site.js` (phone links, photos, animated badge, pond year), `quote.js` (the form), `splash.js` (landing intro) |
| `site/assets/photos/` | Job and koi photos, resized to 1600px max |
| `site/assets/img/`, `site/assets/video/` | Koi badge for the header and footer (`rvph-badge-*.webp`), browser-tab and home-screen icons, link-preview image (`og-image.jpg`), animated badge (MP4 + WebM) |
| `site/favicon.ico` | Tab icon for browsers that look for it at the site root |
| `supabase/migrations/` | Database for quote requests |
| `scripts/build_share.py` | Builds `share/rogue-valley-ponds.html`, the landing page as one file |
| `share/` | The single-file page, for sending or uploading |

No build step. Host the `site/` folder on any static host (Netlify, Cloudflare Pages, GitHub Pages).

## Type, veteran theme and motion

- Big Shoulders Display and Big Shoulders Stencil Display load from the Google Fonts link in each page's `<head>`; Inter comes from the `@import` at the top of `nocturne.css` (a second Google Fonts request). `site.css` names them `--font-display`, `--font-stencil` and `--font-body`.
- Veteran presence: the service ribbon above the header (both pages), the stencil "Veteran owned & operated" line in the hero and on the quote page, the "A veteran's word, in writing" section after the hero (`#veteran`), stencil step numbers, and the rotating seal in the footer. Colors stay the logo's own: red, cream, Pond Blue, brass stars.
- Motion only runs with JavaScript on and never under "reduce motion". A short script in each `<head>` adds `js` to `<html>`; `is-ready` (added by `site.js` when the page is up, or by the intro when it hands off) plays the hero entrance. Section heads, the four commitments and the steps reveal as they scroll in (browsers without scroll timelines show them straight away). Without JavaScript everything is simply visible.

## Intro

The landing page opens with a ~3-second intro (`splash.js`, `splash.css`): red, cream and Pond Blue bands slash across, a brass star bursts into a field of stars, the koi badge punches in over the lit pond, and "Veteran owned & operated" stamps down in stencil. Then the stripes sweep the screen away while the badge flies into its place in the hero, and the headline rises.

- It plays once per browser session (`sessionStorage` key `rvp-intro-seen`). Add `?intro` to the address (`index.html?intro`) to see it again.
- "Skip intro", a click or tap anywhere, or Esc, Enter or Space ends it straight away.
- It never runs with "reduce motion" turned on, with Data Saver on or on a connection slower than 4G, or without JavaScript; the page then simply shows.
- The inline script in `index.html`'s `<head>` decides whether it runs and keeps the page covered in black until it starts; a second one, after the stylesheets, preloads the badge. If `splash.js` doesn't load, the page appears after 4.5 seconds anyway; if the page took more than 3 seconds to load, it skips the intro. The intro waits for its badge image (at most 1.2 seconds) and skips straight to the page if it isn't in by then. `quote.html` has no intro.

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

Run `python3 scripts/build_share.py` after changes to refresh the single-file page. That copy shows the still badge instead of the animation, and has no intro.

## Still to confirm

- The services list and service-area towns are typical placeholders; edit them to what Robert actually does.
- No public web address yet. Facebook link previews need `og:image` to be a full URL (e.g. `https://example.com/assets/img/og-image.jpg`) once the site has one.
