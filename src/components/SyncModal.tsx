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
} from 'lucide-react'
import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Banner } from '@astryxdesign/core/Banner'
import { Collapsible } from '@astryxdesign/core/Collapsible'
import { Card } from '@astryxdesign/core/Card'
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
import { AppModal } from './AppModal'

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
  const setDataText = useDesigner((s) => s.setDataText)
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

  const requireClientId = () => {
    saveDriveSettings()
    if (!clientId.trim()) {
      setStatus({ kind: 'error', msg: 'ใส่ Google OAuth Client ID ก่อน (ดูวิธีสร้างด้านล่าง)' })
      return false
    }
    return true
  }

  const drivePush = async () => {
    if (!requireClientId()) return
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
    if (!requireClientId()) return
    let name = designName.trim() || altText.trim() || 'flex-design'
    if (!name.toLowerCase().endsWith('.json')) name += '.json'
    setStatus({ kind: 'busy', msg: `กำลังเซฟ ${name} ขึ้น Drive…` })
    try {
      const token = await getAccessToken(clientId.trim())
      await uploadJsonToDrive(token, folderId.trim(), name, exportMessageJson(root, altText))
      setStatus({ kind: 'ok', msg: `เซฟ "${name}" ขึ้น Drive แล้ว — เปิดกลับได้จาก "เปิดไฟล์จาก Drive…"` })
      if (driveFiles) {
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
        files.length ? { kind: 'idle' } : { kind: 'error', msg: 'โฟลเดอร์นี้ว่าง (ไม่มีโฟลเดอร์ย่อยหรือไฟล์ .json)' },
      )
    } catch (e: any) {
      setStatus({ kind: 'error', msg: String(e.message ?? e) })
    }
  }

  const driveBrowse = async () => {
    if (!requireClientId()) return
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
    if (!requireClientId()) return
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

  const busy = status.kind === 'busy'

  return (
    <AppModal title="Sync templates" subtitle={`บันทึกไว้ ${count} รายการ`} width={640} onClose={() => setModal(null)}>
      <div className="modal-stack">
        <Card padding={2}>
          <div className="group-title">ไฟล์ (ย้ายข้ามเครื่องเองได้ทันที ไม่ต้องตั้งค่า)</div>
          <div className="btn-row wrap" style={{ paddingTop: 8 }}>
            <Button label="Export ทั้งชุดเป็นไฟล์ .json" icon={<Download size={14} />} size="sm" onClick={exportFile} />
            <Button label="Import จากไฟล์ (merge)" icon={<Upload size={14} />} size="sm" onClick={() => fileRef.current?.click()} />
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
          <div className="hint" style={{ paddingTop: 6 }}>
            Import จะ merge เข้ากับของเดิม — template ชื่อซ้ำจะถูกทับด้วยของในไฟล์
          </div>
        </Card>

        <Card padding={2}>
          <div className="group-title">Google Drive (sync ข้ามเครื่องอัตโนมัติ)</div>
          <div className="modal-stack" style={{ paddingTop: 8 }}>
            <TextInput
              label="Google OAuth Client ID"
              value={clientId}
              placeholder="xxxxxxxx.apps.googleusercontent.com"
              onChange={setClientId}
              size="sm"
            />
            <TextInput label="Drive Folder ID (จากลิงก์โฟลเดอร์)" value={folderId} onChange={setFolderId} size="sm" />
            <div className="btn-row wrap">
              <Button label="อัปโหลดขึ้น Drive" icon={<CloudUpload size={14} />} variant="primary" size="sm" isDisabled={busy} onClick={drivePush} />
              <Button label="ดึงจาก Drive (merge)" icon={<CloudDownload size={14} />} size="sm" isDisabled={busy} onClick={drivePull} />
              <Button
                label="เปิดไฟล์จาก Drive…"
                icon={driveFiles ? <RefreshCw size={14} /> : <FolderOpen size={14} />}
                size="sm"
                isDisabled={busy}
                onClick={driveBrowse}
              />
            </div>
            <div className="save-design-row">
              <div
                style={{ flex: 1, minWidth: 0 }}
                onKeyDown={(e) => e.key === 'Enter' && driveSaveCurrent()}
              >
                <TextInput
                  label="ชื่อไฟล์ของงานนี้"
                  isLabelHidden
                  value={designName}
                  placeholder={`ชื่อไฟล์ของงานนี้ (ว่าง = "${(altText.trim() || 'flex-design').slice(0, 30)}.json")`}
                  onChange={setDesignName}
                  size="sm"
                />
              </div>
              <Button
                label="เซฟงานปัจจุบัน"
                icon={<CloudUpload size={14} />}
                size="sm"
                isDisabled={busy}
                tooltip="เซฟงานที่เปิดอยู่เป็นไฟล์ .json แยกในโฟลเดอร์ Drive"
                onClick={driveSaveCurrent}
              />
            </div>
            {driveFiles && drivePath.length > 0 && (
              <div className="drive-breadcrumb">
                {drivePath.map((p, i) => (
                  <React.Fragment key={p.id}>
                    {i > 0 && <span className="crumb-sep">›</span>}
                    <button
                      className="crumb"
                      disabled={busy || i === drivePath.length - 1}
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
                      disabled={busy}
                    >
                      <Folder size={14} />
                      <span className="drive-file-name">{f.name}</span>
                      <span className="drive-file-time">โฟลเดอร์ ›</span>
                    </button>
                  ) : (
                    <button key={f.id} className="drive-file" onClick={() => openDriveFile(f)} disabled={busy}>
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
            <Collapsible trigger="วิธีตั้งค่า (ทำครั้งเดียว ~5 นาที)" defaultIsOpen={false}>
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
                5. Consent screen: เลือก External แล้ว<b>เพิ่มอีเมลตัวเองเป็น Test user</b>
                <br />
                6. คัดลอก Client ID มาวางด้านบน — Client ID/Folder ID จะถูกจำไว้ในเครื่องนี้
                <br />
                <br />
                การ sync จะเขียนไฟล์ <code>{DRIVE_FILE_NAME}</code> ไว้ในโฟลเดอร์ที่กำหนด — เครื่องอื่นล็อกอิน
                Google บัญชีเดียวกัน (หรือมีสิทธิ์เข้าโฟลเดอร์) แล้วกด "ดึงจาก Drive" ได้เลย
              </div>
            </Collapsible>
          </div>
        </Card>

        {status.kind === 'busy' && <Banner status="info" title={status.msg!} />}
        {status.kind === 'ok' && <Banner status="success" title={status.msg!} />}
        {status.kind === 'error' && <Banner status="error" title={status.msg!} />}
      </div>
    </AppModal>
  )
}
