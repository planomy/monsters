export const MONSTER_COUNT = 30

/** Same monster all day; changes at local midnight. */
export function getDailyMonsterIndex(date = new Date()): number {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0
  }
  return (Math.abs(hash) % MONSTER_COUNT) + 1
}
