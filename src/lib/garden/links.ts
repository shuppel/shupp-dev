import type { CollectionEntry } from 'astro:content';

/**
 * Parse wiki-style links [[note-name]] from markdown content
 * Returns array of note slugs
 */
export function parseWikiLinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const matches = [...content.matchAll(regex)];
  return matches.map(m => m[1].trim().toLowerCase().replace(/\s+/g, '-'));
}

/**
 * Convert wiki-style links to HTML anchor tags
 * [[note-name]] -> <a href="/galaxy/note-name" class="wiki-link">note-name</a>
 */
export function renderWikiLinks(content: string): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (match, noteName) => {
    const slug = noteName.trim().toLowerCase().replace(/\s+/g, '-');
    const displayName = noteName.trim();
    return `<a href="/galaxy/${slug}" class="wiki-link">${displayName}</a>`;
  });
}

/**
 * Generate backlinks for a note
 * Returns all notes that link to the current note (either in connections array or via wiki-links in content)
 */
export function generateBacklinks(
  allNotes: CollectionEntry<'galaxy'>[],
  currentSlug: string
): CollectionEntry<'galaxy'>[] {
  return allNotes.filter(note => {
    // Check explicit connections array
    if (note.data.connections.includes(currentSlug)) {
      return true;
    }
    
    // Check wiki-links in the note body
    const wikiLinks = parseWikiLinks(note.body);
    return wikiLinks.includes(currentSlug);
  });
}

/**
 * Get all unique constellations from garden notes
 */
export function getConstellations(notes: CollectionEntry<'galaxy'>[]): string[] {
  const constellations = new Set(notes.map(note => note.data.constellation));
  return Array.from(constellations).sort();
}

/**
 * Group notes by constellation
 */
export function groupByConstellation(
  notes: CollectionEntry<'galaxy'>[]
): Record<string, CollectionEntry<'galaxy'>[]> {
  return notes.reduce((groups, note) => {
    const constellation = note.data.constellation;
    if (!groups[constellation]) {
      groups[constellation] = [];
    }
    groups[constellation].push(note);
    return groups;
  }, {} as Record<string, CollectionEntry<'galaxy'>[]>);
}
