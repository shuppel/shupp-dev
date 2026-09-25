import type { CollectionEntry } from 'astro:content';

export type ArtEntry = CollectionEntry<'art'>;
export type ArtData = ArtEntry['data'];
export type ArtStatus = ArtData['status'];

interface StatusMeta {
  /** Shown on the card badge and the detail page */
  label: string;
  /** Drives the badge colour via a `is-<tone>` class */
  tone: 'available' | 'reserved' | 'sold' | 'nfs';
}

export const STATUS_META: Record<ArtStatus, StatusMeta> = {
  available: { label: 'Available', tone: 'available' },
  reserved: { label: 'Reserved', tone: 'reserved' },
  sold: { label: 'Sold', tone: 'sold' },
  nfs: { label: 'Not for sale', tone: 'nfs' },
};

/**
 * A piece can be bought only when it is both marked available and actually
 * wired to a checkout. Anything else gets the enquiry link instead, which
 * fails safe: a missing Payment Link never renders a dead Buy button.
 */
export function isPurchasable(data: ArtData): boolean {
  return data.status === 'available' && typeof data.checkoutUrl === 'string' && data.checkoutUrl.length > 0;
}

export function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    // Art is priced in whole units; trailing .00 just adds noise.
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

/**
 * "Original, 1 of 1" / "Edition of 25" / "Edition of 25, no. 3".
 */
export function editionLabel(edition: ArtData['edition']): string {
  if (edition.type === 'original') {
    return 'Original, 1 of 1';
  }

  const size = edition.size;
  if (size === undefined) {
    return 'Limited edition';
  }

  return edition.number === undefined
    ? `Edition of ${size}`
    : `Edition of ${size}, no. ${edition.number}`;
}

/** Newest first, with `order` as a manual override. */
export function sortArt(entries: ArtEntry[]): ArtEntry[] {
  return [...entries].sort((a, b) => {
    if (a.data.order !== b.data.order) return b.data.order - a.data.order;
    if (a.data.year !== b.data.year) return b.data.year - a.data.year;
    return a.data.title.localeCompare(b.data.title);
  });
}

/** Only pieces meant to be published. */
export function visibleArt(entries: ArtEntry[]): ArtEntry[] {
  return entries.filter((entry) => entry.data.visible);
}

/**
 * Builds the mailto: link used for enquiries on pieces that are sold, reserved
 * or not yet wired to a checkout.
 */
export function enquiryHref(email: string, title: string): string {
  const subject = encodeURIComponent(`Enquiry: ${title}`);
  return `mailto:${email}?subject=${subject}`;
}
