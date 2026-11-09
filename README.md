# Lens

Lens is a spoiler log viewer for [Ship of Harkinian](https://github.com/HarbourMasters/Shipwright), [2 Ship 2 Harkinian](https://github.com/2ship2harkinian/2ship2harkinian) and [Lighthouse](https://github.com/HarbourMasters/Lighthouse).

## Using Lens

Find the JSON spoiler log your randomizer wrote (inside a folder named `randomizer`), then pick it in Lens.

Everything starts hidden. Items stay hidden until you tick their check, and hints stay hidden, along with the place they're told, until you tick those. So you can check one location and leave the rest alone. Search covers check names and what the checks contain, but it only matches things you've already revealed. There's also a control that reveals or hides everything at once; it asks you to confirm first.

The page has sections for checks, settings and starting inventory. Anything Lens doesn't recognize ends up under Other data. It remembers the last log you opened and what you'd ticked.

Logs older than the supported versions get a plain "not supported" message, but a version Lens can't read at all gets the benefit of the doubt and opens.  Logs above the supported versions (like nightlies) may not read correctly until Lens is updated.

The build label tells you which port wrote the log and where the build came from.

## Supported games

| Game               | Versions                       |
| ------------------ | ------------------------------ |
| Ship of Harkinian  | 9.3.0+                         |
| 2 Ship 2 Harkinian | 5.0.1+                         |
| Lighthouse         | Any                            |

### Ship of Harkinian

Besides the usual sections you get checks grouped by area or by type, hints, spheres, entrances, tricks, excluded locations, required trials and Master Quest dungeons.

### 2 Ship 2 Harkinian

The sections match Ship's, plus Saria's Song priority. There are no spheres, entrances, tricks, or excluded locations. Gossip stone, paid and Saria's Song hints, and junk items, are decided during play, so Lens can't list them.

### Lighthouse

You get checks, settings and starting inventory. Checks are grouped by world, or by type within each world. When you reveal an item it also tells you where that item normally sits in the game.

## Working on Lens

To run it locally or change it, see [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/BUILDING.md](docs/BUILDING.md).

## License

CC0 1.0 Universal. See [LICENSE](LICENSE).
