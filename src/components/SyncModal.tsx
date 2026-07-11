import React, { useRef, useState } from 'react'
import {
  CloudDownload,
  CloudUpload,
  Download,
  FileJson,
  Folder,
  FolderOpen,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react'
import { useUi } from '../uiStore'
import { useDesigner } from '../store'
import { importTemplates, loadUserTemplates, makeBundle, parseBundle } from '../flex/userTemplates'
import { parsePastedFlex } from '../flex/importJson'
import {
  downloadFileContent,
  downloadFromDrive,
  getAccessToken,
  listJsonFiles,
  uploadJsonToDrive,
  uploadToDrive,
  DRIVE_FILE_NAME,
  FOLDER_MIME,
  type DriveFileInfo,
} from '../gdrive'
import { exportMessageJson } from '../flex/export'

// Prefilled from the folder the user shared; editable in the UI.
const DEFAULT_FOLDER_ID = '1WoUcUOa_uCV53GKPGmyeUOpviRmQtStB'

type Status = { kind: 'idle' | 'busy' | 'ok' | 'error'; msg?: string }

export function SyncModal() {
  const modal = useUi((s) => s.modal)
  const setModal = useUi((s) => s.setModal)
  const loadRoot = useDesigner((s) => s.loadRoot)
  const setAltText = useDesigner((s) => s.setAltText)
  const root = useDesigner((s) => s.root)
  const altText = useDesigner((s) => s.altText)
  const fileRef = useRef<HTMLInputElement>(null)
  const [designName, setDesignName] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [clientId, setClientId] = useState(() => localStorage.getItem('fmsg-gdrive-clientid') ?? '')
  const [folderId, setFolderId] = useState(() => localStorage.getItem('fmsg-gdrive-folder') ?? DEFAULT_FOLDER_ID)
  const [driveFiles, setDriveFiles] = useState<DriveFileInfo[] | null>(null)
  /** breadcrumb path inside the browser; [0] is the configured root folder */
  const [drivePath, setDrivePath] = useState<Array<{ id: string; name: string }>>([])

  if (modal !== 'sync') return null

  const count = loadUserTemplates().length

  const exportFile = () => {
    const bundle = makeBundle()
    if (bundle.templates.length === 0) {
      setStatus({ kind: 'error', msg: 'ยังไม่มี template ที่บันทึกไว้ — กดปุ่ม "บันทึก" บน toolbar ก่อน' })
      return
    }
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `fmsg-templates-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setStatus({ kind: 'ok', msg: `Export ${bundle.templates.length} templates เป็นไฟล์แล้ว` })
  }

  const importFile = async (f: File) => {
    try {
      const list = parseBundle(await f.text())
      const { added, updated } = importTemplates(list)
      setStatus({ kind: 'ok', msg: `Import สำเร็จ — เพิ่มใหม่ ${added}, อัปเดตทับ ${updated} (เปิดดูได้ที่ปุ่ม Templates)` })
    } catch (e: any) {
      setStatus({ kind: 'error', msg: `Import ไม่สำเร็จ: ${e.message ?? e}` })
    }
  }

  const saveDriveSettings = () => {
    localStorage.setItem('fmsg-gdrive-clientid', clientId.trim())
    localStorage.setItem('fmsg-gdrive-folder', folderId.trim())
  }

  const drivePush = async () => {
    saveDriveSettings()
    if (!clientId.trim()) {
      setStatus({ kind: 'error', msg: 'ใส่ Google OAuth Client ID ก่อน (ดูวิธีสร้างด้านล่าง)' })
      return
    }
    setStatus({ kind: 'busy', msg: 'กำลังเชื่อมต่อ Google…' })
    try {
      const token = await getAccessToken(clientId.trim())
      setStatus({ kind: 'busy', msg: 'กำลังอัปโหลดขึ้น Drive…' })
      await uploadToDrive(token, folderId.trim(), JSON.stringify(makeBundle(), null, 2))
      setStatus({ kind: 'ok', msg: `อัปโหลด ${count} templates ขึ้น Drive (${DRIVE_FILE_NAME}) เรียบร้อย` })
    } catch (e: any) {
      setStatus({ kind: 'error', msg: String(e.message ?? e) })
    }
  }

  const driveSaveCurrent = async () => {
    saveDriveSettings()
    if (!clientId.trim()) {
      setStatus({ kind: 'error', msg: 'ใส่ Google OAuth Client ID ก่อน (ดูวิธีสร้างด้านล่าง)' })
      return
    }
    let name = designName.trim() || altText.trim() || 'flex-design'
    if (!name.toLowerCase().endsWith('.json')) name += '.json'
    setStatus({ kind: 'busy', msg: `กำลังเซฟ ${name} ขึ้น Drive…` })
    try {
      const token = await getAccessToken(clientId.trim())
      await uploadJsonToDrive(token, folderId.trim(), name, exportMessageJson(root, altText))
      setStatus({ kind: 'ok', msg: `เซฟ "${name}" ขึ้น Drive แล้ว — เปิดกลับได้จาก "เปิดไฟล์จาก Drive…"` })
      if (driveFiles) {
        // refresh the current browse location so the new file shows up
        const current = drivePath[drivePath.length - 1]?.id ?? folderId.trim()
        setDriveFiles(await listJsonFiles(token, current))
      }
    } catch (e: any) {
      setStatus({ kind: 'error', msg: String(e.message ?? e) })
    }
  }

  /** List a folder's contents and set it as the current browse location. */
  const browseInto = async (path: Array<{ id: string; name: string }>) => {
    setStatus({ kind: 'busy', msg: 'กำลังโหลดรายชื่อไฟล์…' })
    try {
      const token = await getAccessToken(clientId.trim())
      const files = await listJsonFiles(token, path[path.length - 1].id)
      setDriveFiles(files)
      setDrivePath(path)
      setStatus(
        files.length
          ? { kind: 'idle' }
          : { kind: 'error', msg: 'โฟลเดอร์นี้ว่าง (ไม่มีโฟลเดอร์ย่อยหรือไฟล์ .json)' },
      )
    } catch (e: any) {
      setStatus({ kind: 'error', msg: String(e.message ?? e) })
    }
  }

  const driveBrowse = async () => {
    saveDriveSettings()
    if (!clientId.trim()) {
      setStatus({ kind: 'error', msg: 'ใส่ Google OAuth Client ID ก่อน (ดูวิธีสร้างด้านล่าง)' })
      return
    }
    await browseInto([{ id: folderId.trim(), name: 'โฟลเดอร์หลัก' }])
  }

  const openDriveFile = async (f: DriveFileInfo) => {
    setStatus({ kind: 'busy', msg: `กำลังเปิด ${f.name}…` })
    try {
      const token = await getAccessToken(clientId.trim())
      const text = await downloadFileContent(token, f.id)
      // ลองเป็นชุด template ก่อน แล้วค่อยลองเป็น flex message เดี่ยว
      try {
        const { added, updated } = importTemplates(parseBundle(text))
        setStatus({ kind: 'ok', msg: `"${f.name}" เป็นชุด template — เพิ่มใหม่ ${added}, อัปเดตทับ ${updated} (ดูที่ปุ่ม Templates)` })
        return
      } catch {
        /* not a bundle — try flex json */
      }
      const flex = parsePastedFlex(text)
      loadRoot(flex.contents)
      if (flex.altText) setAltText(flex.altText)
      setStatus({ kind: 'ok', msg: `เปิด "${f.name}" เข้า editor แล้ว` })
      setTimeout(() => setModal(null), 700)
    } catch (e: any) {
      setStatus({ kind: 'error', msg: `เปิด "${f.name}" ไม่สำเร็จ: ${e.message ?? e}` })
    }
  }

  const drivePull = async () => {
    saveDriveSettings()
    if (!clientId.trim()) {
      setStatus({ kind: 'error', msg: 'ใส่ Google OAuth Client ID ก่อน (ดูวิธีสร้างด้านล่าง)' })
      return
    }
    setStatus({ kind: 'busy', msg: 'กำลังเชื่อมต่อ Google…' })
    try {
      const token = await getAccessToken(clientId.trim())
      setStatus({ kind: 'busy', msg: 'กำลังดึงจาก Drive…' })
      const text = await downloadFromDrive(token, folderId.trim())
      if (text === null) {
        setStatus({ kind: 'error', msg: `ยังไม่มีไฟล์ ${DRIVE_FILE_NAME} ในโฟลเดอร์นี้ — กด "อัปโหลดขึ้น Drive" จากเครื่องที่มี template ก่อน` })
        return
      }
      const { added, updated } = importTemplates(parseBundle(text))
      setStatus({ kind: 'ok', msg: `Sync จาก Drive สำเร็จ — เพิ่มใหม่ ${added}, อัปเดตทับ ${updated}` })
    } catch (e: any) {
      setStatus({ kind: 'error', msg: String(e.message ?? e) })
    }
  }

  return (
    <div className="modal-overlay" onClick={() => setModal(null)}>
      <div className="modal" style={{ width: 620, maxWidth: '95vw' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b>Sync templates</b> <span className="hint-inline">(บันทึกไว้ {count} รายการ)</span>
          <button className="icon-btn" onClick={() => setModal(null)}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '0 16px 14px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="group">
            <div className="group-title">ไฟล์ (ย้ายข้ามเครื่องเองได้ทันที ไม่ต้องตั้งค่า)</div>
            <div className="btn-row wrap">
              <button className="btn" onClick={exportFile}>
                <Download size={14} /> Export ทั้งชุดเป็นไฟล์ .json
              </button>
              <button className="btn" onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> Import จากไฟล์ (merge)
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) importFile(f)
                  e.target.value = ''
                }}
              />
            </div>
            <div className="hint">Import จะ merge เข้ากับของเดิม — template ชื่อซ้ำจะถูกทับด้วยของในไฟล์</div>
          </div>

          <div className="group">
            <div className="group-title">Google Drive (sync ข้ามเครื่องอัตโนมัติ)</div>
            <label className="field">
              <span className="field-label">Google OAuth Client ID</span>
              <input
                value={clientId}
                placeholder="xxxxxxxx.apps.googleusercontent.com"
                onChange={(e) => setClientId(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Drive Folder ID (จากลิงก์โฟลเดอร์)</span>
              <input value={folderId} onChange={(e) => setFolderId(e.target.value)} />
            </label>
            <div className="btn-row wrap">
              <button className="btn primary" disabled={status.kind === 'busy'} onClick={drivePush}>
                <CloudUpload size={14} /> อัปโหลดขึ้น Drive
              </button>
              <button className="btn" disabled={status.kind === 'busy'} onClick={drivePull}>
                <CloudDownload size={14} /> ดึงจาก Drive (merge)
              </button>
              <button className="btn" disabled={status.kind === 'busy'} onClick={driveBrowse}>
                {driveFiles ? <RefreshCw size={14} /> : <FolderOpen size={14} />} เปิดไฟล์จาก Drive…
              </button>
            </div>
            <div className="save-design-row">
              <input
                value={designName}
                placeholder={`ชื่อไฟล์ของงานนี้ (ว่าง = "${(altText.trim() || 'flex-design').slice(0, 30)}.json")`}
                onChange={(e) => setDesignName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && driveSaveCurrent()}
              />
              <button className="btn" disabled={status.kind === 'busy'} onClick={driveSaveCurrent} title="เซฟงานที่เปิดอยู่เป็นไฟล์ .json แยกในโฟลเดอร์ Drive">
                <CloudUpload size={14} /> เซฟงานปัจจุบัน
              </button>
            </div>
            {driveFiles && drivePath.length > 0 && (
              <div className="drive-breadcrumb">
                {drivePath.map((p, i) => (
                  <React.Fragment key={p.id}>
                    {i > 0 && <span className="crumb-sep">›</span>}
                    <button
                      className="crumb"
                      disabled={status.kind === 'busy' || i === drivePath.length - 1}
                      onClick={() => browseInto(drivePath.slice(0, i + 1))}
                    >
                      {p.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}
            {driveFiles && driveFiles.length > 0 && (
              <div className="drive-file-list">
                {driveFiles.map((f) =>
                  f.mimeType === FOLDER_MIME ? (
                    <button
                      key={f.id}
                      className="drive-file drive-folder"
                      onClick={() => browseInto([...drivePath, { id: f.id, name: f.name }])}
                      disabled={status.kind === 'busy'}
                    >
                      <Folder size={14} />
                      <span className="drive-file-name">{f.name}</span>
                      <span className="drive-file-time">โฟลเดอร์ ›</span>
                    </button>
                  ) : (
                    <button key={f.id} className="drive-file" onClick={() => openDriveFile(f)} disabled={status.kind === 'busy'}>
                      <FileJson size={14} />
                      <span className="drive-file-name">{f.name}</span>
                      <span className="drive-file-time">{new Date(f.modifiedTime).toLocaleString('th-TH')}</span>
                    </button>
                  ),
                )}
              </div>
            )}
            {driveFiles && driveFiles.length > 0 && (
              <div className="hint">
                คลิกโฟลเดอร์เพื่อเข้าไปดูข้างใน · คลิกไฟล์เพื่อเปิด — ชุด template จะ merge เข้าคลัง / flex JSON
                เดี่ยวจะเปิดเข้า editor
              </div>
            )}
            <details>
              <summary style={{ cursor: 'pointer', fontSize: 12 }}>วิธีตั้งค่า (ทำครั้งเดียว ~5 นาที)</summary>
              <div className="hint" style={{ paddingTop: 6 }}>
                1. เข้า <b>console.cloud.google.com</b> → สร้าง project (หรือใช้ของเดิม)
                <br />
                2. เปิดใช้ <b>Google Drive API</b> (APIs &amp; Services → Library)
                <br />
                3. ไปที่ Credentials → <b>Create OAuth client ID</b> → เลือก <b>Web application</b>
                <br />
                4. เพิ่ม Authorized JavaScript origins: <code>https://nidss.github.io</code> (และ{' '}
                <code>http://localhost:5173</code> ถ้าจะใช้ตอน dev)
                <br />
                5. ถ้าถามให้ตั้งค่า consent screen: เลือก External แล้วเพิ่มอีเมลตัวเองเป็น Test user
                <br />
                6. คัดลอก Client ID มาวางด้านบน — เสร็จแล้ว! Client ID/Folder ID จะถูกจำไว้ในเครื่องนี้
                <br />
                <br />
                การ sync จะเขียนไฟล์ <code>{DRIVE_FILE_NAME}</code> ไว้ในโฟลเดอร์ที่กำหนด — เครื่องอื่นล็อกอิน
                Google บัญชีเดียวกัน (หรือมีสิทธิ์เข้าโฟลเดอร์) แล้วกด "ดึงจาก Drive" ได้เลย
              </div>
            </details>
          </div>

          {status.kind !== 'idle' && (
            <div className={`status ${status.kind === 'error' ? 'error' : 'ok'}`}>
              {status.kind === 'busy' ? '⏳ ' : ''}
              {status.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
