import React, { useRef, useState } from 'react'
import {
  CloudDownload,
  CloudUpload,
  Download,
  FileJson,
  FileUp,
  Folder,
  FolderOpen,
  HardDriveDownload,
  RefreshCw,
  Settings2,
  Upload,
} from 'lucide-react'
import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Banner } from '@astryxdesign/core/Banner'
import { Collapsible } from '@astryxdesign/core/Collapsible'
import { ClickableCard } from '@astryxdesign/core/ClickableCard'
import { TabList, Tab } from '@astryxdesign/core/TabList'
import { Divider } from '@astryxdesign/core/Divider'
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

function SectionTitle({ icon, title, desc }: { icon: React.ReactNode; title: string; desc?: string }) {
  return (
    <div className="sync-section-title">
      <span className="sync-section-icon">{icon}</span>
      <div>
        <div className="sync-section-name">{title}</div>
        {desc && <div className="hint">{desc}</div>}
      </div>
    </div>
  )
}

export function SyncModal() {
  const modal = useUi((s) => s.modal)
  const setModal = useUi((s) => s.setModal)
  const loadRoot = useDesigner((s) => s.loadRoot)
  const setAltText = useDesigner((s) => s.setAltText)
  const root = useDesigner((s) => s.root)
  const altText = useDesigner((s) => s.altText)
  const setDataText = useDesigner((s) => s.setDataText)
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'file' | 'drive'>('drive')
  const [designName, setDesignName] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [clientId, setClientId] = useState(() => localStorage.getItem('fmsg-gdrive-clientid') ?? '')
  const [folderId, setFolderId] = useState(() => localStorage.getItem('fmsg-gdrive-folder') ?? DEFAULT_FOLDER_ID)
  const [driveFiles, setDriveFiles] = useState<DriveFileInfo[] | null>(null)
  /** breadcrumb path inside the browser; [0] is the configured root folder */
  const [drivePath, setDrivePath] = useState<Array<{ id: string; name: string }>>([])

  if (modal !== 'sync') return null

  const count = loadUserTemplates().length
  const connected = !!clientId.trim()

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
      setStatus({ kind: 'error', msg: 'ใส่ Google OAuth Client ID ในส่วน "การเชื่อมต่อ" ก่อน (มีวิธีตั้งค่าอยู่ข้างใน)' })
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
      setStatus({ kind: 'ok', msg: `เซฟ "${name}" ขึ้น Drive แล้ว — เปิดกลับได้จากรายการไฟล์ด้านล่าง` })
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
        setStatus({ kind: 'error', msg: `ยังไม่มีไฟล์ ${DRIVE_FILE_NAME} ในโฟลเดอร์นี้ — กด "เก็บขึ้น Drive" จากเครื่องที่มี template ก่อน` })
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
    <AppModal title="Sync" subtitle={`template ที่บันทึกไว้ในเครื่องนี้: ${count} รายการ`} width={620} onClose={() => setModal(null)}>
      <div className="modal-stack">
        <TabList value={tab} onChange={(v: any) => { setTab(v); setStatus({ kind: 'idle' }) }} size="sm">
          <Tab value="drive" label="Google Drive" />
          <Tab value="file" label="ไฟล์ (Export / Import)" />
        </TabList>

        {tab === 'file' && (
          <div className="modal-stack">
            <ClickableCard label="Export ทั้งชุดเป็นไฟล์ .json" onClick={exportFile}>
              <div className="sync-action-card">
                <Download size={20} />
                <div>
                  <b>Export ทั้งชุดเป็นไฟล์ .json</b>
                  <div className="hint">ดาวน์โหลด template ทั้ง {count} รายการเป็นไฟล์เดียว เอาไปเปิดที่เครื่องอื่นหรือเก็บสำรองได้</div>
                </div>
              </div>
            </ClickableCard>
            <ClickableCard label="Import จากไฟล์" onClick={() => fileRef.current?.click()}>
              <div className="sync-action-card">
                <Upload size={20} />
                <div>
                  <b>Import จากไฟล์ (merge)</b>
                  <div className="hint">รวมเข้ากับของเดิม — template ชื่อซ้ำจะถูกทับด้วยของในไฟล์ ชื่อใหม่ถูกเพิ่ม</div>
                </div>
              </div>
            </ClickableCard>
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
        )}

        {tab === 'drive' && (
          <div className="modal-stack">
            <Collapsible
              trigger={connected ? '⚙️ การเชื่อมต่อ — ตั้งค่าแล้ว (กดเพื่อแก้ไข)' : '⚙️ การเชื่อมต่อ — ยังไม่ได้ตั้งค่า (กดเพื่อเริ่ม)'}
              defaultIsOpen={!connected}
            >
              <div className="modal-stack" style={{ paddingTop: 8 }}>
                <TextInput
                  label="Google OAuth Client ID"
                  value={clientId}
                  placeholder="xxxxxxxx.apps.googleusercontent.com"
                  onChange={setClientId}
                  size="sm"
                />
                <TextInput label="Drive Folder ID (จากลิงก์โฟลเดอร์)" value={folderId} onChange={setFolderId} size="sm" />
                <div className="hint sync-setup-guide">
                  <b>วิธีตั้งค่า (ครั้งเดียว ~5 นาที):</b>
                  <ol>
                    <li>เข้า <b>console.cloud.google.com</b> → สร้าง project → เปิดใช้ <b>Google Drive API</b></li>
                    <li>Credentials → <b>Create OAuth client ID</b> → เลือก <b>Web application</b></li>
                    <li>เพิ่ม Authorized JavaScript origins: <code>https://nidss.github.io</code></li>
                    <li>Consent screen: เลือก External + <b>เพิ่มอีเมลตัวเองเป็น Test user</b></li>
                    <li>คัดลอก Client ID มาวางด้านบน — ระบบจะจำไว้ให้</li>
                  </ol>
                </div>
              </div>
            </Collapsible>

            <Divider />

            <SectionTitle
              icon={<RefreshCw size={16} />}
              title="Sync คลัง template"
              desc={`เก็บ template ทั้งชุดเป็นไฟล์ ${DRIVE_FILE_NAME} — เครื่องอื่นกดดึงกลับได้`}
            />
            <div className="btn-row wrap">
              <Button label="เก็บขึ้น Drive" icon={<CloudUpload size={14} />} variant="primary" size="sm" isDisabled={busy} onClick={drivePush} />
              <Button label="ดึงจาก Drive (merge)" icon={<CloudDownload size={14} />} size="sm" isDisabled={busy} onClick={drivePull} />
            </div>

            <Divider />

            <SectionTitle icon={<FileUp size={16} />} title="เซฟงานที่เปิดอยู่" desc="เก็บงานปัจจุบันเป็นไฟล์ .json ของตัวเองในโฟลเดอร์ (ชื่อซ้ำ = อัปเดตทับ)" />
            <div className="save-design-row">
              <div style={{ flex: 1, minWidth: 0 }} onKeyDown={(e) => e.key === 'Enter' && driveSaveCurrent()}>
                <TextInput
                  label="ชื่อไฟล์"
                  isLabelHidden
                  value={designName}
                  placeholder={`ชื่อไฟล์ (ว่าง = "${(altText.trim() || 'flex-design').slice(0, 28)}.json")`}
                  onChange={setDesignName}
                  size="sm"
                />
              </div>
              <Button label="เซฟขึ้น Drive" icon={<HardDriveDownload size={14} />} size="sm" isDisabled={busy} onClick={driveSaveCurrent} />
            </div>

            <Divider />

            <SectionTitle icon={<FolderOpen size={16} />} title="ไฟล์ในโฟลเดอร์" desc="เปิดงานหรือชุด template ที่เก็บไว้ — เข้าโฟลเดอร์ย่อยได้" />
            {!driveFiles && (
              <div>
                <Button label="เรียกดูไฟล์" icon={<FolderOpen size={14} />} size="sm" isDisabled={busy} onClick={driveBrowse} />
              </div>
            )}
            {driveFiles && (
              <>
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
                  <span style={{ flex: 1 }} />
                  <Button label="รีเฟรช" icon={<RefreshCw size={13} />} variant="ghost" size="sm" isDisabled={busy} onClick={() => browseInto(drivePath)} />
                </div>
                {driveFiles.length > 0 && (
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
                <div className="hint">คลิกไฟล์เพื่อเปิด — ชุด template จะ merge เข้าคลัง / flex JSON เดี่ยวจะเปิดเข้า editor</div>
              </>
            )}
          </div>
        )}

        {status.kind === 'busy' && <Banner status="info" title={status.msg!} />}
        {status.kind === 'ok' && <Banner status="success" title={status.msg!} />}
        {status.kind === 'error' && <Banner status="error" title={status.msg!} />}
      </div>
    </AppModal>
  )
}
