// Google Drive sync via Google Identity Services (OAuth token in the browser).
// The user supplies their own OAuth Client ID; nothing is proxied through a server.

export const DRIVE_FILE_NAME = 'fmsg-templates.json'

let gsiLoading: Promise<void> | null = null

function loadGsi(): Promise<void> {
  if (!gsiLoading) {
    gsiLoading = new Promise((resolve, reject) => {
      if ((window as any).google?.accounts?.oauth2) return resolve()
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('โหลดสคริปต์ Google ไม่สำเร็จ (เช็คอินเทอร์เน็ต/ad blocker)'))
      document.head.appendChild(s)
    })
  }
  return gsiLoading
}

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getAccessToken(clientId: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.token
  await loadGsi()
  return new Promise((resolve, reject) => {
    try {
      const tc = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        // Full drive scope so we can write into a folder the user shared with
        // themselves (drive.file only reaches files this app created).
        scope: 'https://www.googleapis.com/auth/drive',
        callback: (resp: any) => {
          if (resp.access_token) {
            cachedToken = { token: resp.access_token, expiresAt: Date.now() + (resp.expires_in ?? 3600) * 1000 }
            resolve(resp.access_token)
          } else {
            reject(new Error(resp.error_description ?? resp.error ?? 'ไม่ได้รับ access token'))
          }
        },
        error_callback: (err: any) => reject(new Error(err?.message ?? 'การเชื่อมต่อถูกยกเลิก')),
      })
      tc.requestAccessToken()
    } catch (e: any) {
      reject(new Error(e?.message ?? 'เรียก Google OAuth ไม่สำเร็จ'))
    }
  })
}

async function driveFetch(token: string, url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300)
    if (res.status === 404) {
      throw new Error('ไม่พบโฟลเดอร์/ไฟล์ใน Drive (เช็ค Folder ID และสิทธิ์เข้าถึง) — ' + body)
    }
    throw new Error(`Drive API ตอบ ${res.status}: ${body}`)
  }
  return res
}

export async function findTemplateFile(
  token: string,
  folderId: string,
): Promise<{ id: string; modifiedTime: string } | null> {
  const q = encodeURIComponent(`name='${DRIVE_FILE_NAME}' and '${folderId}' in parents and trashed=false`)
  const res = await driveFetch(
    token,
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
  )
  const data = await res.json()
  return data.files?.[0] ?? null
}

/** Create or update fmsg-templates.json inside the folder. Returns the file id. */
export async function uploadToDrive(token: string, folderId: string, content: string): Promise<string> {
  const existing = await findTemplateFile(token, folderId)
  if (existing) {
    await driveFetch(
      token,
      `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media&supportsAllDrives=true`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: content },
    )
    return existing.id
  }
  const boundary = 'fmsg_boundary_7f3k'
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify({ name: DRIVE_FILE_NAME, parents: [folderId] }),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n')
  const res = await driveFetch(
    token,
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true',
    { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body },
  )
  return (await res.json()).id
}

/** Download fmsg-templates.json content, or null if it doesn't exist yet. */
export async function downloadFromDrive(token: string, folderId: string): Promise<string | null> {
  const existing = await findTemplateFile(token, folderId)
  if (!existing) return null
  const res = await driveFetch(
    token,
    `https://www.googleapis.com/drive/v3/files/${existing.id}?alt=media&supportsAllDrives=true`,
  )
  return res.text()
}
