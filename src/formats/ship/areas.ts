export const OTHER_AREA = 'Other'

// Names with no area prefix, checked against location_list.cpp and ShuffleSongs.cpp
const EXCEPTIONS = new Map<string, string>(
  Object.entries({
    'Queen Gohma': 'Deku Tree',
    'King Dodongo': "Dodongo's Cavern",
    Barinade: "Jabu Jabu's Belly",
    'Phantom Ganon': 'Forest Temple',
    Volvagia: 'Fire Temple',
    Morpha: 'Water Temple',
    Twinrova: 'Spirit Temple',
    'Bongo Bongo': 'Shadow Temple',
    Ganon: "Ganon's Castle",
    "Ganon's Boss Key": "Ganon's Castle",
    "Ganon's Soul": "Ganon's Castle",
    'Gift from Rauru': 'Hyrule Market',
    'Win Condition': 'Hyrule Market',
    "Link's Pocket": 'Kokiri Forest',
    'Sheik in Forest': 'Sacred Forest Meadow',
    'Sheik in Crater': 'Death Mountain Crater',
    'Sheik in Ice Cavern': 'Ice Cavern',
    'Sheik at Colossus': 'Desert Colossus',
    'Sheik in Kakariko': 'Kakariko Village',
    'Sheik at Temple': 'Hyrule Market',
    'Song from Impa': 'Hyrule Castle',
    'Song from Malon': 'Lon Lon Ranch',
    'Song from Saria': 'Sacred Forest Meadow',
    'Song from Windmill': 'Kakariko Village',
    "Song from Royal Family's Tomb": 'Graveyard',
    'Song from Ocarina of Time': 'Hyrule Field',
    'OGC Great Fairy Reward': 'Hyrule Castle',
  }),
)

export interface AreaPrefix {
  area: string
  prefix: string
}

export function createAreas(areas: readonly AreaPrefix[]): {
  areaOf: (checkName: string) => string
  areaOrder: string[]
} {
  // Longest prefix first, so a prefix that starts another can't shadow it
  const prefixes = areas
    .map(({ prefix, area }) => ({ prefix: `${prefix} `, area }))
    .sort((a, b) => b.prefix.length - a.prefix.length)

  return {
    areaOf: (checkName) => {
      const exception = EXCEPTIONS.get(checkName)
      if (exception !== undefined) return exception
      const match = prefixes.find(({ prefix }) => checkName.startsWith(prefix))
      return match?.area ?? OTHER_AREA
    },
    areaOrder: [...new Set([...areas.map(({ area }) => area), OTHER_AREA])],
  }
}
