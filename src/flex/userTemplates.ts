// User-saved templates, persisted in localStorage.

export interface UserTemplate {
  id: string
  name: string
  json: any // plain flex JSON (no _uid)
  altText: string
  dataText: string
  savedAt: string
}

const KEY = 'fmsg-user-templates-v1'

export function loadUserTemplates(): UserTemplate[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function persist(list: UserTemplate[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
    return true
  } catch {
    return false // storage full (e.g. big data-URI images)
  }
}

/** Save (or overwrite by name). Returns the new list, or null if storage failed. */
export function saveUserTemplate(
  t: Omit<UserTemplate, 'id' | 'savedAt'>,
): UserTemplate[] | null {
  const list = loadUserTemplates()
  const existing = list.findIndex((x) => x.name === t.name)
  const item: UserTemplate = {
    ...t,
    id: existing >= 0 ? list[existing].id : `t${Date.now().toString(36)}`,
    savedAt: new Date().toISOString(),
  }
  const next = existing >= 0 ? list.map((x, i) => (i === existing ? item : x)) : [item, ...list]
  return persist(next) ? next : null
}

export function removeUserTemplate(id: string): UserTemplate[] {
  const next = loadUserTemplates().filter((x) => x.id !== id)
  persist(next)
  return next
}
