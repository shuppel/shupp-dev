---
# Template for a new piece. Filenames beginning with an underscore are excluded
# by the collection's glob, so this file is never published — copy it to
# `my-piece.md` and the slug becomes /art/my-piece.
title: "Example Piece"
description: "A one or two line description. Shown on the gallery card and used as the meta description."

year: 2026
medium: "Oil on linen"
dimensions: "24 x 36 in"
series: "Optional series name"

edition:
  type: original       # original | limited
  # size: 25           # run size, limited editions only
  # number: 3          # this impression, limited editions only

status: available      # available | reserved | sold | nfs
price: 1200
currency: USD
# Stripe Payment Link for this piece. For a one-of-one, set the link's payment
# limit to 1 in Stripe so it closes itself the moment it sells.
# checkoutUrl: "https://buy.stripe.com/xxxxxxxxxxxx"
framed: false
shippingNote: "Ships flat, insured, from Arlington VA. Allow 5-7 business days."

# Images live next to this file, e.g. src/content/art/images/example-piece.jpg.
# Both are optional — a piece can be listed before it has been photographed.
# cover: "./images/example-piece.jpg"
# coverAlt: "Describe the work for someone who cannot see it"
# gallery:
#   - src: "./images/example-piece-detail.jpg"
#     alt: "Detail of the lower left corner"
#     caption: "Detail"

featured: false
visible: true
order: 0
tags: ["oil", "landscape"]
---

Everything below the frontmatter is the piece's story — what it is, how it came
about, anything a collector would want to know. It renders under the buy button
on the detail page and supports normal Markdown.
