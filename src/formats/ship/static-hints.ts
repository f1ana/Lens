// A hint the game gives away through a setting, with no entry in the log
export interface WorkedOutHint {
  checks: string[]
  label: string
  setting: string
}

const SKULLTULA_COUNTS = ['10', '20', '30', '40', '50', '100']

export const WORKED_OUT_HINTS: WorkedOutHint[] = [
  ...SKULLTULA_COUNTS.map((count) => ({
    setting: `${count} GS Hint`,
    label: `${count} Skulltula`,
    checks: [`Kak ${count} Gold Skulltula Reward`],
  })),
  {
    setting: 'Hyrule Loach Hint',
    label: 'Hyrule Loach',
    checks: ['LH Hyrule Loach Reward'],
  },
  {
    setting: 'Horseback Archery Hint',
    label: 'Horseback Archery',
    checks: ['GF HBA 1000 Points', 'GF HBA 1500 Points'],
  },
  { setting: 'Malon Hint', label: 'Malon', checks: ['KF Links House Cow'] },
  {
    setting: 'Big Poes Hint',
    label: 'Big Poes',
    checks: ['Market 10 Big Poes'],
  },
  {
    setting: 'Chickens Hint',
    label: 'Chickens',
    checks: ['Kak Anju as Child'],
  },
  {
    setting: "Biggoron's Hint",
    label: 'Biggoron',
    checks: ['DMT Trade Claim Check'],
  },
  {
    setting: 'Frog Ocarina Game Hint',
    label: 'Frog Ocarina Game',
    checks: ['ZR Frogs Ocarina Game'],
  },
  {
    setting: 'Ocarina of Time Hint',
    label: 'Ocarina of Time',
    checks: ['HF Ocarina of Time Item', 'Song from Ocarina of Time'],
  },
  {
    setting: 'Mask Shop Hint',
    label: 'Mask Shop',
    checks: ['LW Deku Theater Skull Mask', 'LW Deku Theater Mask of Truth'],
  },
]
