export const FAILED_MESSAGE = 'This section couldn’t be read.'

export interface Fact {
  label: string
  value: string
}

export interface HintRef {
  source: string
  text: string
}

export interface Check {
  disguise?: string
  hints: HintRef[]
  id: string
  item: string
  name: string
  // Already worded, e.g. "40 rupees"
  price?: string
  // Lowercased name, area, item and disguise
  searchText: string
  // e.g. "Sphere 11"
  tags: string[]
}

export interface Landing {
  detail?: string
  place: string
  // Unset when the format can't tell which place it is
  placeId?: string
}

export interface Link {
  door: string
  // Unset when it starts from nowhere, like a spawn or a warp song
  fromPlaceId?: string
  // The id of the row showing this door
  id: string
  landing: Landing
}

export interface Place {
  doors: Link[]
  id: string
  name: string
  // Only one way out, whatever the log lists
  singleDoor: boolean
}

interface RowText {
  id: string
  primary: string
  searchText?: string
  secondary?: string
}

export interface PlainRow extends RowText {
  kind: 'plain'
}

export interface CheckRow extends RowText {
  checkId: string
  kind: 'check'
}

export interface ConcealedRow extends RowText {
  kind: 'concealed'
}

interface ConcealedCheckRow extends RowText {
  checkId: string
  kind: 'concealed-check'
}

export interface LinkRow extends RowText {
  kind: 'link'
  link: Link
}

export type Row =
  CheckRow | ConcealedCheckRow | ConcealedRow | LinkRow | PlainRow

export function isConcealed(row: Row): boolean {
  return row.kind === 'concealed' || row.kind === 'concealed-check'
}

export function revealKey(row: Row): string {
  return 'checkId' in row ? row.checkId : row.id
}

export interface RowGroup {
  rows: Row[]
  title?: string
}

export interface Grouping {
  groups: RowGroup[]
  // Unique within a section; the saved choice is keyed on it
  id: string
  label: string
  // Not carried to the next log, because its headings spoil unticked rows
  perLog?: boolean
}

type Groupings = [Grouping, ...Grouping[]]

export type SectionContent =
  // Rows that include doors, and the places they join, by id
  | { groupings: Groupings; kind: 'links'; places: Record<string, Place> }
  | { groupings: Groupings; kind: 'rows' }
  | { kind: 'failed'; message: string }
  | { kind: 'text'; text: string }

export type RowContent = Extract<SectionContent, { groupings: Groupings }>

export function hasRows(content: SectionContent): content is RowContent {
  return content.kind === 'rows' || content.kind === 'links'
}

export interface Section {
  content: SectionContent
  count?: number
  id: string
  note?: string
  // Hidden until everything is revealed
  spoilerCount?: boolean
  title: string
}

// Whether the port's maintainers published the release the log came from
export type Build =
  | { kind: 'official'; release: string }
  | { kind: 'unofficial' }
  // The log holds no version information at all
  | { kind: 'unrecorded' }
  // The log can't say, or it is newer than the releases Lens knows
  | { kind: 'unverified' }

export type GameTheme = '2ship' | 'lighthouse' | 'ship'

interface Provenance {
  build: Build
  port: string
  theme: GameTheme
}

export interface Seed {
  checks: Check[]
  details: Fact[]
  facts: Fact[]
  // Scopes saved ticks to one log
  key: string
  provenance: Provenance
  sections: Section[]
  subtitle: string
  title: string
}

type RejectReason =
  | 'data-unavailable'
  | 'not-a-log'
  | 'not-json'
  | 'too-large'
  | 'unsupported-version'

export type OpenResult =
  | { message: string; reason: RejectReason; status: 'rejected' }
  | { seed: Seed; status: 'opened' }

export interface LogFormat {
  name: string
  read(log: Record<string, unknown>): Promise<OpenResult>
  recognizes(log: Record<string, unknown>): boolean
  supported?: string
  theme: GameTheme
}
