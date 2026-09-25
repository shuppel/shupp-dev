# Art Shop

Selling originals and limited editions from shupp.dev.

## The split

shupp.dev is a static Astro site built to `dist/` and served by Netlify. There
is no server at runtime, so the site cannot hold a cart, take a card number or
track inventory. It does not need to:

| Concern | Owned by |
| --- | --- |
| Gallery, imagery, story, SEO | This repo (`art` content collection) |
| Price display | This repo (`price`, kept in sync by hand) |
| Card details, tax, shipping, receipts | Stripe (hosted Payment Link) |
| Whether a piece is still for sale | Stripe's payment limit, mirrored here as `status` |

Nothing sensitive lives in this repo. There are no Stripe API keys, because the
site never calls the Stripe API — a Payment Link is just a URL.

## One-time setup

1. Create a Stripe account and complete business verification.
2. Turn on **Stripe Tax** (Settings → Tax). It registers and calculates sales
   tax per destination, which matters once you ship out of Virginia.
3. Set up **shipping rates** (Settings → Shipping) — at minimum a flat domestic
   rate and an international rate. Originals are worth insuring; price that in.
4. Set `ENABLE_ART_SHOP=true` in the Netlify environment (Site settings →
   Environment variables). Until this is set, `/art` builds with an empty
   gallery, no detail pages are emitted, and the Art link stays out of the nav.

## Listing a piece

1. Copy `src/content/art/_example-piece.md` to
   `src/content/art/<slug>.md`. The filename becomes the URL: `/art/<slug>`.
2. Drop photographs into `src/content/art/images/` and reference them as
   `./images/<file>.jpg`. They go through `astro:assets`, so Astro emits
   responsive `srcset`s and modern formats — do not put artwork in `public/`,
   which is served unprocessed and hands out the full-resolution file.
3. Create the Payment Link in Stripe:
   - Products → Add product, named to match the piece.
   - Price = the piece's price. One-time, not recurring.
   - Payment Links → Create, select that product.
   - **Set "Limit the number of payments" to 1** for an original, or to the run
     size for a limited edition. This is what stops the same piece selling
     twice; the link closes itself when the limit is reached.
   - Enable **Collect shipping address**, and the shipping rates from setup.
4. Paste the link into the piece's `checkoutUrl`, commit, push.

A Buy button only renders when `status: available` *and* `checkoutUrl` is set.
Anything else falls back to an enquiry mailto, so a half-finished listing can
never show a dead button.

## When something sells

Stripe emails you. Then:

1. Set `status: sold` in the piece's frontmatter and push. The card grays, the
   price strikes through, and the Buy button becomes "Enquire about similar
   work".
2. Ship it. Keep the tracking number on the Stripe payment for your records.

Leaving sold work up is deliberate — it is the body of work, and it is what
persuades the next buyer. `nfs` is for pieces that were never for sale.

## Things that will bite you

- **Price drift.** `price` in frontmatter is display-only; the amount charged
  is whatever the Payment Link says. If you change one, change both. Stripe is
  the source of truth.
- **Sales tax nexus.** Stripe Tax calculates, but you are still the one who has
  to register in states where you cross a threshold. Worth an accountant's hour
  once sales are regular.
- **Shipping originals.** Flat vs. rolled, insurance, and international customs
  forms are real per-sale work. This is the part that makes people quit; price
  it honestly rather than absorbing it.
- **Image resolution.** Upload what looks good at 1600px wide, not the print
  master. The gallery never needs more, and anything you publish is downloadable.
- **Chargebacks.** Photograph the packed work before it ships. It is the only
  evidence you will have.

## Growing out of this

If you reach the point of wanting a cart, live inventory, or discount codes,
the upgrade path is: add `@astrojs/netlify`, move the affected routes to SSR,
and swap Payment Links for Checkout Sessions created in a serverless function
holding `STRIPE_SECRET_KEY`. The `art` collection and both pages carry over
unchanged — only the buy button's target changes. Don't do this before the
volume justifies it.
