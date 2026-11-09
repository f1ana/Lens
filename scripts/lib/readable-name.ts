// Mirrors the ports' convertEnumToReadableName
export function readableName(
  code: string,
  prefix: string,
  abbreviations: readonly string[] = [],
): string {
  let name = code.startsWith(prefix) ? code.slice(prefix.length) : code
  const abbreviation = abbreviations.find((a) => name.startsWith(`${a}_`))
  if (abbreviation !== undefined) name = name.slice(abbreviation.length + 1)
  return name
    .split('_')
    .map((w) => {
      const word = w.toLowerCase()
      return word === 'hp' ? 'HP' : word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}
