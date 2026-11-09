export const OTHER_TYPE = 'Other'

export function createCheckTypes(
  checkTypes: Record<string, string>,
): (checkName: string) => string {
  const types = new Map<string, string>(Object.entries(checkTypes))
  return (checkName) => types.get(checkName) ?? OTHER_TYPE
}
