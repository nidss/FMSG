# เอกสารระบบ — Flex Message Designer

> Web app สำหรับออกแบบ [LINE Flex Message](https://developers.line.biz/en/docs/messaging-api/using-flex-messages/) แบบ visual: ลาก-วาง แก้ไขสด ผูกข้อมูล export code และ sync งานผ่าน Google Drive
>
> **ใช้งานจริง:** https://nidss.github.io/FMSG/ · **Repo:** https://github.com/nidss/FMSG

---

## สารบัญ

1. [ภาพรวมระบบ](#1-ภาพรวมระบบ)
2. [คู่มือการใช้งาน](#2-คู่มือการใช้งาน)
3. [Data binding](#3-data-binding)
4. [การ Export](#4-การ-export)
5. [การส่งเข้า LINE](#5-การส่งเข้า-line)
6. [Template ของฉัน และการ Sync](#6-template-ของฉัน-และการ-sync)
7. [Google Drive](#7-google-drive)
8. [สถาปัตยกรรมโค้ด](#8-สถาปัตยกรรมโค้ด)
9. [รูปแบบข้อมูล](#9-รูปแบบข้อมูล)
10. [การพัฒนาและ Deploy](#10-การพัฒนาและ-deploy)
11. [ข้อจำกัดที่ควรรู้](#11-ข้อจำกัดที่ควรรู้)

---

## 1. ภาพรวมระบบ

Flex Message Designer เป็น **Single Page Application (React + TypeScript + Vite)** ที่ทำงานทั้งหมดใน browser — **ไม่มี backend** ข้อมูลทุกอย่างอยู่ในเครื่องผู้ใช้ (localStorage) หรือใน Google Drive ของผู้ใช้เอง

### หน้าจอหลักแบ่งเป็น 4 ส่วน

```
┌──────────────────────────────────────────────────────────────┐
│  Toolbar: ใหม่ · Templates · บันทึก · Sync · วาง JSON ·        │
│           ทำเป็น Carousel · altText · Data · Export · ส่งเข้า LINE │
├────────────┬────────────────────────────┬───────────────────┤
│ Components │                            │                   │
│ (palette   │      Live Preview          │    Properties     │
│  ลากวาง)   │   (หน้าจอแชทจำลอง)          │   (inspector)     │
├────────────┤                            │                   │
│ Structure  │                            │                   │
│ (tree)     │                            │                   │
└────────────┴────────────────────────────┴───────────────────┘
                          (+ Data panel เปิด/ปิดได้)
```

### ความสามารถหลัก

| ฟีเจอร์ | รายละเอียด |
|---|---|
| ลาก-วาง | ลาก component จาก palette ลง preview หรือ tree มีเส้นบอกจุดแทรก ย้ายตำแหน่งได้ |
| Structure tree | เห็นโครงสร้างทั้งหมด เลือก/ย้าย/ทำสำเนา/ลบ |
| แก้ไขสด | คลิกเลือก → แก้ property ใน inspector, ดับเบิลคลิกข้อความ → พิมพ์แก้ตรงนั้น |
| อัปโหลดรูป | เลือกไฟล์จากเครื่อง แปลงเป็น data URI + ย่อขนาดอัตโนมัติ |
| Lucide Icons | เลือกจาก ~1,500 icons ค้นหา/เลือกสีได้ (URL ผ่าน Iconify CDN) |
| Templates | สำเร็จรูป 6 แบบ + template ส่วนตัวที่บันทึกเอง |
| Data binding | `{{ตัวแปร}}` ผูกกับ JSON data source แสดงผลจริงใน preview |
| Export | flex JSON / message JSON / ไฟล์ JS พร้อมฟังก์ชัน bind |
| วาง JSON | วางโค้ดจากที่อื่นมาแสดงและแก้ต่อ |
| ส่งเข้า LINE | push ผ่าน Messaging API จากในแอป (มี curl fallback) |
| Sync | export/import ไฟล์ + Google Drive (เปิด/เซฟ/เรียกดูโฟลเดอร์) |
| อื่นๆ | Undo/Redo (Ctrl+Z / Ctrl+Shift+Z), ปุ่ม Delete, autosave |

---

## 2. คู่มือการใช้งาน

### 2.1 สร้างงานใหม่

- กด **"ใหม่"** เริ่มจาก bubble เปล่า หรือกด **"Templates"** เลือกแบบสำเร็จรูป
- กด **"ทำเป็น Carousel"** เพื่อแปลง bubble เดี่ยวเป็น carousel แล้วเพิ่ม bubble ได้สูงสุด 12 ใบ (เลือก carousel ใน tree → ปุ่ม "+ เพิ่ม bubble")

### 2.2 จัด layout

- **ลากจาก palette** (Box แนวตั้ง/แนวนอน/baseline, Text, Image, Icon, Button, Separator, Filler, Span) ไปวางใน preview หรือใน tree — มีเส้นสีเขียวบอกตำแหน่งที่จะแทรก
- **ย้ายตำแหน่ง**: ลาก component ใน preview/tree ไปวางที่ใหม่ หรือใช้ปุ่มลูกศร ↑↓ ใน inspector
- **กติกาการวาง**: box แนว baseline รับได้เฉพาะ icon/text/filler · span อยู่ใน text เท่านั้น · bubble อยู่ใน carousel เท่านั้น (ระบบบังคับให้อัตโนมัติ)

### 2.3 แก้ไข component

- **คลิก** component ใน preview หรือ tree → property ทั้งหมดขึ้นที่ inspector ด้านขวา
- **ดับเบิลคลิกข้อความ** ใน preview → พิมพ์แก้ได้ทันที (Enter = ยืนยัน, Esc = ยกเลิก)
- bubble มีปุ่มเพิ่ม/ลบ block: **header / hero / body / footer**
- ปุ่มบน inspector: เลื่อนขึ้น/ลง · ทำสำเนา · ลบ (หรือกดปุ่ม Delete บนคีย์บอร์ด)

### 2.4 รูปภาพและไอคอน

- component ประเภท image/icon มีปุ่ม **"อัปโหลดรูป"** — เลือกไฟล์แล้วระบบแปลงเป็น data URI ให้ (ย่อรูปใหญ่เหลือ ≤1200px อัตโนมัติ)
- ปุ่ม **"Lucide Icons"** เปิดตัวเลือก icon — ค้นหาด้วยชื่อภาษาอังกฤษ (star, phone, cart, …) เลือกสีได้ ระบบใส่ URL ให้เอง

### 2.5 วาง JSON จากที่อื่น

กดปุ่ม **"วาง JSON"** แล้ววางโค้ดได้ 4 รูปแบบ:

1. bubble หรือ carousel ตรงๆ — `{ "type": "bubble", ... }`
2. flex message เต็ม — `{ "type": "flex", "altText": "...", "contents": {...} }` (ดึง altText ให้ด้วย)
3. push payload — `{ "to": "U...", "messages": [ ... ] }` (หยิบ flex message ตัวแรก)
4. `{ "contents": {...} }`

เห็น preview สดทันทีเมื่อ JSON ถูกต้อง แล้วกด "โหลดเข้า editor"

---

## 3. Data binding

ทำ template ครั้งเดียว เปลี่ยนเฉพาะข้อมูล:

1. พิมพ์ `{{ชื่อตัวแปร}}` ในข้อความ / URL / label ใดก็ได้ เช่น `สวัสดีคุณ {{name}}` — รองรับ path ลึก เช่น `{{order.items[0].price}}`
2. กดปุ่ม **"Data"** เปิด Data panel → ใส่ JSON เช่น `{ "name": "สมชาย", "total": "380" }`
3. ติ๊ก **"แสดงข้อมูลจริงใน preview"** → preview แทนค่าให้เห็นทันที
4. Data panel แสดงรายการตัวแปรทั้งหมดที่ใช้ใน template พร้อมค่าปัจจุบัน (ตัวแดง = ไม่มีในข้อมูล)

ตัวแปรที่หาไม่เจอจะถูกทิ้งไว้เป็น `{{...}}` ตามเดิม (ไม่กลายเป็นค่าว่าง)

---

## 4. การ Export

ปุ่ม **"Export"** มี 3 แบบ (คัดลอก หรือดาวน์โหลดเป็นไฟล์ได้):

| แบบ | ได้อะไร | ใช้เมื่อ |
|---|---|---|
| **JSON (contents)** | เฉพาะ bubble/carousel | วางใน LINE simulator หรือส่วน `contents` ของโค้ด |
| **JSON (message เต็ม)** | `{ type, altText, contents }` | ส่งเป็น message ใน Messaging API ตรงๆ |
| **JavaScript + bind()** | ไฟล์ JS มี `buildFlexMessage(data)` | มี binding — ไม่ต้องเขียนโค้ดแทนค่าเอง |

ถ้า template มี `{{...}}` จะมี checkbox ให้เลือกว่า export แบบแทนค่าด้วยข้อมูลใน Data panel เลยหรือคงตัวแปรไว้

ตัวอย่างการใช้ไฟล์ JS ที่ export:

```js
import { buildFlexMessage } from './flex-message.js'

const message = buildFlexMessage({ name: 'สมชาย', total: '380' })
await client.pushMessage({ to: USER_ID, messages: [message] })
```

---

## 5. การส่งเข้า LINE

ปุ่ม **"ส่งเข้า LINE"**:

1. ใส่ **Channel Access Token** (จาก [LINE Developers Console](https://developers.line.biz/console/) → channel → Messaging API)
2. ใส่ **User ID ผู้รับ** (ขึ้นต้น `U...`)
3. กดส่ง — แอปเรียก `POST https://api.line.me/v2/bot/message/push` โดยตรง

ถ้า browser ติด CORS ของ LINE API แอปจะแสดง **คำสั่ง curl สำเร็จรูป** ให้คัดลอกไปรันใน terminal แทน · token/User ID ถูกเก็บใน localStorage เครื่องนั้นเท่านั้น · ถ้าเปิดโหมด binding อยู่ จะส่งข้อความที่แทนค่าแล้ว

---

## 6. Template ของฉัน และการ Sync

### บันทึก template

ปุ่ม **"บันทึก"** → ตั้งชื่อ → เก็บลง localStorage ของ browser (บันทึกทั้งดีไซน์ + altText + data source) — เปิดใช้จากหน้า Templates ส่วน **"Templates ของฉัน"** (คลิกเปิด / ถังขยะลบ / ชื่อซ้ำ = เขียนทับ)

### Sync (ปุ่ม "Sync")

**แบบไฟล์** — ไม่ต้องตั้งค่า:
- **Export ทั้งชุด** → ไฟล์ `fmsg-templates-YYYY-MM-DD.json`
- **Import (merge)** → ชื่อซ้ำถูกทับ ชื่อใหม่ถูกเพิ่ม

**แบบ Google Drive** — ตั้งค่าครั้งเดียว (ดูข้อ 7):
- **อัปโหลดขึ้น Drive** → เขียน `fmsg-templates.json` (ชุด template ทั้งหมด) ลงโฟลเดอร์
- **ดึงจาก Drive (merge)** → อ่านไฟล์เดียวกันจากเครื่องไหนก็ได้
- **เซฟงานปัจจุบัน** → เซฟงานที่เปิดอยู่เป็นไฟล์ `.json` แยกของตัวเอง (ชื่อ default = altText, ชื่อซ้ำ = อัปเดตไฟล์เดิม)
- **เปิดไฟล์จาก Drive…** → เรียกดูโฟลเดอร์ (เข้าโฟลเดอร์ย่อยได้ มี breadcrumb) แล้วคลิกเปิดไฟล์ — ระบบตรวจให้เอง: ชุด template → merge เข้าคลัง / flex JSON เดี่ยว → เปิดเข้า editor

---

## 7. Google Drive

### การตั้งค่า (ครั้งเดียว ~5 นาที)

1. เข้า [console.cloud.google.com](https://console.cloud.google.com) → สร้าง project
2. เปิดใช้ **Google Drive API** (APIs & Services → Library)
3. Credentials → **Create OAuth client ID** → ประเภท **Web application**
4. เพิ่ม Authorized JavaScript origins: `https://nidss.github.io` (และ `http://localhost:5173` สำหรับ dev)
5. OAuth consent screen: เลือก External + **เพิ่มอีเมลที่จะใช้ล็อกอินเป็น Test user** (สำคัญ! ไม่งั้นเจอ "Access blocked")
6. คัดลอก **Client ID** มาวางในหน้า Sync — Client ID และ Folder ID จะถูกจำไว้ในเครื่อง

### หมายเหตุ

- Folder ID ดูจากลิงก์โฟลเดอร์: `https://drive.google.com/drive/folders/<FOLDER_ID>`
- แอปขอ scope `https://www.googleapis.com/auth/drive` เพื่อให้เขียนลงโฟลเดอร์ใดก็ได้ที่ผู้ใช้เข้าถึง — token อยู่ในหน่วยความจำของหน้าเว็บเท่านั้น ไม่ถูกส่งไป server ใด (แอปไม่มี server)
- โหมด Testing ของ Google จะให้เฉพาะ Test users ใช้ได้ (สูงสุด 100 คน) — เหมาะกับใช้ส่วนตัว/ในทีม

---

## 8. สถาปัตยกรรมโค้ด

```
src/
├── flex/                    # โดเมน Flex Message (ไม่ผูกกับ UI)
│   ├── types.ts             # type ของ bubble/carousel/box/text/... (+ _uid ภายใน)
│   ├── constants.ts         # ตาราง map ขนาด LINE → px (bubble width, text size, spacing)
│   ├── uid.ts               # withUids/stripUids/findPath/findParent — จัดการ tree ด้วย _uid
│   ├── defaults.ts          # โรงงานสร้าง node ใหม่ + กติกาว่า parent รับ child อะไรได้
│   ├── binding.ts           # แทนค่า {{path}} + เก็บรายชื่อ placeholder
│   ├── importJson.ts        # แปลง JSON ที่วางมา (4 รูปแบบ) → container
│   ├── templates.ts         # template สำเร็จรูป 6 แบบ
│   ├── userTemplates.ts     # CRUD template ส่วนตัวใน localStorage + bundle export/import
│   └── export.ts            # exportJson / exportMessageJson / exportJs / curlCommand
│
├── renderer/
│   └── FlexRender.tsx       # แปลง flex JSON → DOM ด้วย CSS flexbox (หัวใจของ preview)
│                            #   + คลิกเลือก, ดับเบิลคลิกแก้ข้อความ, drag & drop ใน preview
│
├── components/
│   ├── Toolbar.tsx          # ปุ่มคำสั่งทั้งหมดด้านบน
│   ├── Palette.tsx          # กล่อง component ให้ลาก
│   ├── TreeView.tsx         # structure tree (เลือก/ลาก/วาง/ลบ/ทำสำเนา)
│   ├── Inspector.tsx        # ฟอร์ม property ต่อ component type + อัปโหลดรูป
│   ├── PreviewPane.tsx      # ฉากแชท + สลับโหมด binding
│   ├── DataPanel.tsx        # editor ของ data source + รายการตัวแปร
│   ├── fields.tsx           # input components ที่ใช้ร่วมกัน (Text/Select/Color/Number/Toggle)
│   ├── TemplatesModal.tsx   # gallery template (ของฉัน + สำเร็จรูป)
│   ├── SaveTemplateModal.tsx# ตั้งชื่อบันทึก template
│   ├── SyncModal.tsx        # export/import ไฟล์ + Google Drive ทั้งหมด
│   ├── PasteJsonModal.tsx   # วาง JSON + live preview
│   ├── IconPickerModal.tsx  # ตัวเลือก Lucide icons
│   ├── ExportModal.tsx      # export 3 แบบ
│   └── SendModal.tsx        # ส่งเข้า LINE + curl fallback
│
├── gdrive.ts                # Google Identity Services + Drive REST API (list/upload/download)
├── store.ts                 # zustand store หลัก: document tree, selection, undo/redo, autosave
├── uiStore.ts               # สถานะ modal / icon picker / data panel
├── App.tsx                  # ประกอบ layout + keyboard shortcuts
├── main.tsx                 # entry point
└── styles.css               # สไตล์ทั้งแอป
```

### แนวคิดสำคัญ

- **`_uid` ภายใน tree** — ทุก node ใน document มี `_uid` ที่สร้างตอนโหลด ใช้ระบุตัวตนตอนเลือก/ลาก/แก้ และถูก **strip ออกเสมอ** ตอน export (`stripUids`)
- **การแก้ไขทุกครั้งผ่าน `store.ts`** — ฟังก์ชัน `mutate()` clone tree → แก้ → เก็บ snapshot ลง history (สูงสุด 50 ก้าว) → autosave ลง localStorage
- **Preview กับ binding** — ตอนเปิดโหมด binding, `PreviewPane` สร้าง tree ฉบับแทนค่าแล้ว (uid เดิม) มาแสดง ทำให้ยังคลิกเลือก/แก้ไขได้ตามปกติ
- **Renderer เลียนแบบ LINE** — map ค่า keyword ของ LINE (`md`, `xl`, `mega`, …) เป็น px ตามตาราง `constants.ts` และ map `layout/flex/gravity/align` เป็น CSS flexbox

---

## 9. รูปแบบข้อมูล

### 9.1 localStorage keys

| Key | เก็บอะไร |
|---|---|
| `fmsg-designer-v1` | งานปัจจุบัน `{ root, altText, dataText }` (autosave) |
| `fmsg-user-templates-v1` | template ส่วนตัว `UserTemplate[]` |
| `fmsg-gdrive-clientid` / `fmsg-gdrive-folder` | ค่า Google Drive |
| `fmsg-token` / `fmsg-to` | Channel token / User ID สำหรับส่งเข้า LINE |

### 9.2 UserTemplate

```ts
{
  id: string          // ภายใน
  name: string        // ใช้เป็น key ตอน merge (ชื่อซ้ำ = ทับ)
  json: any           // flex JSON (ไม่มี _uid)
  altText: string
  dataText: string    // data source JSON (string)
  savedAt: string     // ISO datetime
}
```

### 9.3 Template bundle (ไฟล์ export / fmsg-templates.json ใน Drive)

```json
{
  "app": "fmsg-designer",
  "version": 1,
  "exportedAt": "2026-07-11T04:00:00.000Z",
  "templates": [ /* UserTemplate[] */ ]
}
```

### 9.4 ไฟล์งานเดี่ยวใน Drive (จาก "เซฟงานปัจจุบัน")

flex message เต็มรูปแบบ ใช้กับ Messaging API ได้ตรงๆ:

```json
{ "type": "flex", "altText": "...", "contents": { "type": "bubble", ... } }
```

---

## 10. การพัฒนาและ Deploy

### รันในเครื่อง

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build → dist/
```

### Deploy อัตโนมัติ

ทุกครั้งที่ push เข้า **`main`** GitHub Actions (`.github/workflows/deploy.yml`) จะ:

1. `npm ci` + `npm run build`
2. deploy `dist/` ขึ้น **GitHub Pages** → https://nidss.github.io/FMSG/

การตั้งค่า Pages ของ repo ต้องเป็น **Source: GitHub Actions** (ตั้งไว้แล้ว) — workflow มีขั้น "รอ legacy build" เผื่อกรณี setting ถูกสลับกลับไปเป็น branch mode จะได้ไม่โดน build โค้ดดิบทับ

### เพิ่ม template สำเร็จรูป

เพิ่ม object ใน `src/flex/templates.ts` (flex JSON ธรรมดา ไม่ต้องใส่ `_uid`) แล้ว UI จะขึ้นให้เองพร้อม preview

---

## 11. ข้อจำกัดที่ควรรู้

- **รูป data URI** (จากปุ่มอัปโหลด) แสดงได้ใน preview เท่านั้น — LINE จริงต้องใช้รูปบน **HTTPS hosting** (JPEG/PNG) ให้เปลี่ยน URL ก่อนส่งจริง
- **Lucide icons** ใส่เป็น SVG ผ่าน Iconify CDN — preview แสดงได้ ส่วนบน LINE จริงสเปครองรับ PNG แนะนำแปลงเป็น PNG บน hosting สำหรับ production
- **ส่งเข้า LINE จาก browser** อาจติด CORS — ใช้ curl ที่แอปเตรียมให้ หรือยิงผ่าน backend ของคุณ
- **Renderer เป็นการเลียนแบบ** การแสดงผลของ LINE — ใกล้เคียงมากแต่อาจต่างเล็กน้อยในเคสซับซ้อน (เช่น absolute position ซ้อนหลายชั้น) ควรดูของจริงก่อนใช้งาน production
- **localStorage มีเพดาน ~5MB** — ถ้าเก็บรูป data URI เยอะจะเต็ม แอปจะแจ้งเตือนตอนบันทึกไม่สำเร็จ
- **Google Drive โหมด Testing** ใช้ได้เฉพาะอีเมลที่เพิ่มเป็น Test user และ Google จะขอยืนยันสิทธิ์ซ้ำเป็นระยะ
- component ที่ยังไม่รองรับใน editor: `video` และ `animated` image (วาง JSON ที่มี component เหล่านี้ได้ แต่ preview จะไม่แสดงส่วนนั้น)
