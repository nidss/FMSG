// คลัง template กลางบน Google Drive — ทุกคนเห็นร่วมกัน
// อ่าน: ผ่าน API key (โฟลเดอร์แชร์แบบ anyone-with-link) ไม่ต้อง login
// เขียน: ผ่าน OAuth (merge เข้าไฟล์กลางแล้วอัปโหลดกลับ)

import type { UserTemplate } from './userTemplates'
import { findFileByName, uploadJsonToDrive } from '../gdrive'

export const SHARED_FILE_NAME = 'fmsg-shared-templates.json'

function parseSharedBundle(text: string): UserTemplate[] {
  const data = JSON.parse(text)
  const list = Array.isArray(data) ? data : data?.templates
  if (!Array.isArray(list)) return []
  return list.filter((t: any) => typeof t?.name === 'string' && t?.json?.type)
}

/** อ่านคลังกลางแบบสาธารณะด้วย API key — คืน null ถ้ายังไม่มีไฟล์ */
export async function fetchSharedPublic(apiKey: string, folderId: string): Promise<UserTemplate[] | null> {
  const q = encodeURIComponent(`name='${SHARED_FILE_NAME}' and '${folderId}' in parents and trashed=false`)
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&key=${encodeURIComponent(apiKey)}&supportsAllDrives=true&includeItemsFromAllDrives=true`,
  )
  if (!listRes.ok) {
    throw new Error(`อ่านคลังออนไลน์ไม่สำเร็จ (${listRes.status}) — เช็คว่าโฟลเดอร์แชร์แบบ "anyone with link" และ API key ถูกต้อง`)
  }
  const file = (await listRes.json()).files?.[0]
  if (!file) return null
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${encodeURIComponent(apiKey)}&supportsAllDrives=true`,
  )
  if (!res.ok) throw new Error(`ดาวน์โหลดคลังออนไลน์ไม่สำเร็จ (${res.status})`)
  return parseSharedBundle(await res.text())
}

/** อ่านคลังกลางผ่าน OAuth token (สำหรับคนในทีมที่ login แล้ว) */
export async function fetchSharedOAuth(token: string, folderId: string): Promise<UserTemplate[] | null> {
  const file = await findFileByName(token, folderId, SHARED_FILE_NAME)
  if (!file) return null
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) throw new Error(`ดาวน์โหลดคลังออนไลน์ไม่สำเร็จ (${res.status})`)
  return parseSharedBundle(await res.text())
}

/**
 * แชร์ template ขึ้นคลังกลาง: อ่านของเดิม → merge (ชื่อซ้ำ = ทับ) → อัปโหลดกลับ
 * คืนจำนวน template ทั้งหมดในคลังหลัง merge
 */
export async function shareTemplate(token: string, folderId: string, t: UserTemplate): Promise<number> {
  const existing = (await fetchSharedOAuth(token, folderId)) ?? []
  const i = existing.findIndex((x) => x.name === t.name)
  const item: UserTemplate = { ...t, savedAt: new Date().toISOString() }
  if (i >= 0) existing[i] = item
  else existing.unshift(item)
  const bundle = {
    app: 'fmsg-designer',
    version: 1,
    exportedAt: new Date().toISOString(),
    templates: existing,
  }
  await uploadJsonToDrive(token, folderId, SHARED_FILE_NAME, JSON.stringify(bundle, null, 2))
  return existing.length
}
