import type { Row, RowGroup } from '@/model/seed'

export class Buckets {
  readonly #byTitle = new Map<string, Row[]>()

  add(title: string, row: Row): void {
    const rows = this.#byTitle.get(title)
    if (rows) rows.push(row)
    else this.#byTitle.set(title, [row])
  }

  // Titles outside order sort after it, and last comes after those
  groups(order: readonly string[] = [], last?: string): RowGroup[] {
    const unlisted = [...this.#byTitle.keys()]
      .filter((title) => title !== last && !order.includes(title))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    const titles = [...order.filter((title) => title !== last), ...unlisted]
    if (last !== undefined) titles.push(last)
    return titles.flatMap((title) => {
      const rows = this.#byTitle.get(title)
      return rows ? [{ title, rows }] : []
    })
  }
}
