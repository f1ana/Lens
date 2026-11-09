const STRING = /"((?:[^"\\]|\\.)*)"/g

export function fail(file: string, what: string): never {
  throw new Error(`${file}: ${what}`)
}

function stringEnd(text: string, start: number): number {
  let i = start + 1
  while (i < text.length && text.charAt(i) !== '"')
    i += text.charAt(i) === '\\' ? 2 : 1
  return i
}

export function stripComments(text: string): string {
  let out = ''
  let i = 0
  while (i < text.length) {
    const c = text.charAt(i)
    const next = text.charAt(i + 1)
    if (c === '"') {
      const j = stringEnd(text, i)
      out += text.slice(i, j + 1)
      i = j + 1
    } else if (c === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2)
      i = end === -1 ? text.length : end + 2
    } else if (c === '/' && next === '/') {
      const end = text.indexOf('\n', i)
      i = end === -1 ? text.length : end
    } else {
      out += c
      i++
    }
  }
  return out
}

export function capture(match: RegExpMatchArray, n: number): string {
  const value = match.at(n)
  if (value === undefined) throw new Error(`regex group ${n} missing`)
  return value
}

export function strings(text: string): string[] {
  return Array.from(text.matchAll(STRING), (m) => capture(m, 1))
}

export function enumItems(text: string, name: string, file: string): string[] {
  const body = new RegExp(
    String.raw`RANDO_ENUM_BEGIN\(${name}\)([\s\S]*?)RANDO_ENUM_END`,
  ).exec(stripComments(text))?.[1]
  if (body === undefined) fail(file, `enum ${name} not found`)
  return Array.from(body.matchAll(/RANDO_ENUM_ITEM\((\w+)\)/g), (m) =>
    capture(m, 1),
  )
}

export function typedefEnumItems(
  text: string,
  name: string,
  file: string,
): string[] {
  const body = new RegExp(
    String.raw`typedef\s+enum\s*\{([^}]*)\}\s*${name}\s*;`,
  ).exec(stripComments(text))?.[1]
  if (body === undefined) fail(file, `enum ${name} not found`)
  return Array.from(body.matchAll(/(?:^|,)\s*([A-Za-z_]\w*)/g), (m) =>
    capture(m, 1),
  )
}

export function enumValues(
  text: string,
  name: string,
  file: string,
): Map<string, number> {
  const body = new RegExp(String.raw`\benum\s+${name}\s*\{([^}]*)\}`).exec(
    stripComments(text),
  )?.[1]
  if (body === undefined) fail(file, `enum ${name} not found`)
  const values = new Map<string, number>()
  let next = 0
  for (const member of body.split(',')) {
    const match = /^\s*([A-Za-z_]\w*)\s*(?:=\s*(0x[0-9A-Fa-f]+|\d+))?\s*$/.exec(
      member,
    )
    if (!match) {
      if (member.trim() !== '')
        fail(file, `can't read ${member.trim()} in ${name}`)
      continue
    }
    const explicit = match.at(2)
    const value = explicit === undefined ? next : Number(explicit)
    values.set(capture(match, 1), value)
    next = value + 1
  }
  return values
}

// `start` is the index just after the opening bracket
export function argumentsFrom(text: string, start: number): string {
  let depth = 1
  let i = start
  for (; i < text.length && depth > 0; i++) {
    const c = text.charAt(i)
    if (c === '"') i = stringEnd(text, i)
    else if (c === '(') depth++
    else if (c === ')') depth--
  }
  return text.slice(start, i - 1)
}
