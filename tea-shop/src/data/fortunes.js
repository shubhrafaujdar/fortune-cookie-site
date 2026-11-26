// Categories (each has a painted paper tag) and rarity levels.
// The fortunes themselves are in public/fortunes/fortunes.json.

export const CATEGORIES = [
  { id: 'luck', label: 'Luck', tag: 'luck' },
  { id: 'friendship', label: 'Friendship', tag: 'friendship' },
  { id: 'love', label: 'Love', tag: 'love' },
  { id: 'courage', label: 'Courage', tag: 'courage' },
  { id: 'creativity', label: 'Creativity', tag: 'creativity' },
  { id: 'beginnings', label: 'New Beginnings', tag: 'new-beginnings' },
  { id: 'wisdom', label: 'Wisdom', tag: 'wisdom' },
  { id: 'surprises', label: 'Unexpected Surprises', tag: 'surprises' },
]

export const RARITY = {
  c: { id: 'common', label: 'Common', weight: 60 },
  u: { id: 'uncommon', label: 'Uncommon', weight: 26 },
  r: { id: 'rare', label: 'Rare', weight: 11 },
  v: { id: 'very-rare', label: 'Very Rare', weight: 3 },
}

export const RARITY_BY_ID = Object.fromEntries(Object.values(RARITY).map((r) => [r.id, r]))
