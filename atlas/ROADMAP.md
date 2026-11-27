# Scattered Atlas roadmap

The ship hub is live: bridge, engine room, Archive, captain's quarters and
dockyard, with the star map on the bridge. The Crescent can't fly to planets
yet. This roadmap is the worlds and systems that come after the hub.

Each world gets its own feature card in [`roadmap/`](roadmap/) with the game
design and the full asset list, in the same format as the art requests.

## Now

| Item | Notes |
| --- | --- |
| Ship hub polish | Rooms, menu, terminals and sound are in. Ongoing fixes. |

## Next

| Item | Card | Notes |
| --- | --- | --- |
| Planet runs | (to write) | The star map flies the Crescent to a planet and back. Needed by every world below. |
| World loading screen | (below) | Load a world's assets behind a loading screen and free them on return. Dino World is the first world heavy enough to need it. |
| **Dino World** | [roadmap/dino-world.md](roadmap/dino-world.md) | A kids' A to Z letter game. Astro the Archivist goes on the mission; pressing the letter a dinosaur's name starts with lets you talk to it and adds it to the **Dinodex**, which lives in the Archive afterwards. 26 dinosaurs, five zones. |

## Later

### Dual-language space station (English and Spanish)

A second kids' world for learning words in two languages, starting with English
and Spanish. The setting is a space station the Crescent docks at: crew
members, robots and objects around the station each have a name in both
languages, and the player matches, hears and collects them, much like the
Dinodex. A word book (a station logbook, say) would hold what's been learned.

What's known so far:

- **Language toggle.** One setting switches the "home" language. Every word
  needs both an English and a Spanish spoken clip, and all text is drawn at
  runtime, so the fonts must cover á, é, í, ó, ú, ü, ñ, ¿ and ¡.
- **Typed answers.** If any mode has the player type letters, the touch
  keyboard and key handling need ñ and the accented vowels.
- **A full new asset set.** A station has nothing in common with the ship or
  Dino World: new plates, crew, props, fx, icons and audio in two languages.
  That means a separate world bundle loaded behind the loading screen, and
  freed when the player leaves.
- **More languages later.** Copy and audio should be keyed by language code
  (`en`, `es`, and later others) from the start, so adding one doesn't change
  the code.

A full feature card with the asset list comes once Dino World's loop has been
tested.

### World loading screen

Shared by Dino World, the space station and any later world.

- Each world has an asset manifest (a JSON list of every file it needs).
- Leaving the ship shows a loading scene, such as the Crescent in a warp tunnel,
  with a progress bar driven by Bevy's asset load states.
- On return to the ship, the world's assets are released so phones don't run
  out of memory.
- On slow connections the loading scene should be playable or at least
  animated, and should say how much is left, so a kid isn't staring at a frozen
  screen.
