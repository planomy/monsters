const STORAGE_KEY = 'monsterz-questions-expanded'

export function loadQuestionsExpanded(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'false') return false
    if (stored === 'true') return true
  } catch {
    /* ignore */
  }
  return true
}

export function saveQuestionsExpanded(expanded: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(expanded))
  } catch {
    /* ignore */
  }
}
