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

// ---------- bundle export / import ----------

export interface TemplateBundle {
  app: 'fmsg-designer'
  version: 1
  exportedAt: string
  templates: UserTemplate[]
}

export function makeBundle(): TemplateBundle {
  return {
    app: 'fmsg-designer',
    version: 1,
    exportedAt: new Date().toISOString(),
    templates: loadUserTemplates(),
  }
}

/** Parse a bundle (or a bare template array) and validate its shape. */
export function parseBundle(text: string): UserTemplate[] {
  const data = JSON.parse(text)
  const list = Array.isArray(data) ? data : data?.templates
  if (!Array.isArray(list)) throw new Error('ไม่ใช่ไฟล์ template ของแอปนี้')
  for (const t of list) {
    if (typeof t?.name !== 'string' || !t?.json?.type) {
      throw new Error('โครงสร้างไฟล์ template ไม่ถูกต้อง')
    }
  }
  return list as UserTemplate[]
}

/** Merge incoming templates into localStorage (same name = incoming wins). */
export function importTemplates(incoming: UserTemplate[]): {
  added: number
  updated: number
  list: UserTemplate[]
} {
  const list = loadUserTemplates()
  let added = 0
  let updated = 0
  for (const t of incoming) {
    const i = list.findIndex((x) => x.name === t.name)
    const item: UserTemplate = {
      name: t.name,
      json: t.json,
      altText: t.altText ?? 'Flex Message',
      dataText: t.dataText ?? '',
      savedAt: t.savedAt ?? new Date().toISOString(),
      id: i >= 0 ? list[i].id : t.id || `t${Date.now().toString(36)}${added}`,
    }
    if (i >= 0) {
      list[i] = item
      updated++
    } else {
      list.push(item)
      added++
    }
  }
  persist(list)
  return { added, updated, list }
}
