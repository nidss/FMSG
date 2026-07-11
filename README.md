# Flex Message Designer 💬

Web app สำหรับออกแบบ [LINE Flex Message](https://developers.line.biz/en/docs/messaging-api/using-flex-messages/) แบบ visual — ทำงานคล้าย LINE Flex Message Simulator แต่แก้ไขแบบลากวางได้ พร้อม data binding และ export code ไปใช้ต่อได้ทันที

## ฟีเจอร์

- 🖱️ **ลาก-วาง จัด layout** — ลาก component จาก palette ไปวางใน preview หรือ structure tree เห็นผลทันที มีเส้นบอกตำแหน่งที่จะแทรก
- 🌲 **Structure tree** — เห็นโครงสร้าง component ทั้งหมด คลิกเลือก / ลากย้าย / ทำสำเนา / ลบ ได้จาก tree
- ✏️ **จิ้มแล้วแก้** — คลิก component เพื่อแก้ property ใน inspector หรือ**ดับเบิลคลิกข้อความใน preview เพื่อพิมพ์แก้ตรงนั้นเลย**
- 🖼️ **อัปโหลดรูปได้เลย** — เลือกไฟล์จากเครื่อง ระบบแปลงเป็น data URI ให้อัตโนมัติ (ย่อขนาดให้ด้วย) ไม่ต้องหา URL เอง
- ⭐ **Lucide Icons ในตัว** — เลือกได้จาก icon กว่า 1,500 ตัว ค้นหาได้ เลือกสีได้ ใส่เป็น URL ให้อัตโนมัติ
- 📦 **Templates สำเร็จรูป** — ร้านอาหาร, ใบเสร็จ, ตั๋ว, สินค้า carousel, นามบัตร, โปรโมชั่น
- 🔗 **Data binding** — พิมพ์ `{{ชื่อตัวแปร}}` ในข้อความ/URL/label ใดก็ได้ แล้วผูกกับ JSON ใน Data panel — ทำ template ทีเดียว เปลี่ยนข้อมูลได้เรื่อยๆ ดูผลจริงใน preview ได้
- 📤 **Export JSON / JS** — export ได้ทั้ง flex contents JSON, message JSON เต็ม, หรือไฟล์ JavaScript ที่มีฟังก์ชัน `buildFlexMessage(data)` พร้อม logic bind ในตัว เอาไปใช้กับ Messaging API ได้เลย
- 🚀 **ส่งเข้า LINE ได้เลย** — ใส่ Channel Access Token + User ID แล้วกดส่ง (หรือคัดลอกคำสั่ง curl ไปรันเองถ้า browser ติด CORS)
- 💾 **บันทึกเป็น template ของฉัน** — เซฟงาน (ดีไซน์ + altText + data source) เก็บใน browser เปิดใช้ซ้ำได้จากหน้า Templates
- 🔄 **Sync ข้ามเครื่อง** — export/import template ทั้งชุดเป็นไฟล์ .json หรือ sync ผ่าน Google Drive (ใช้ OAuth Client ID ของคุณเอง เขียนไฟล์ `fmsg-templates.json` ลงโฟลเดอร์ที่กำหนด)
- ↩️ Undo/Redo (Ctrl+Z / Ctrl+Shift+Z), ลบด้วยปุ่ม Delete, งานถูก autosave ใน browser

## เริ่มใช้งาน

```bash
npm install
npm run dev      # เปิด http://localhost:5173
npm run build    # build production ลง dist/
```

ไม่ต้องมี backend — เป็น static SPA ล้วนๆ deploy ขึ้น GitHub Pages / Netlify / Vercel ได้เลย

## การใช้ JS ที่ export ออกมา

```js
import { buildFlexMessage } from './flex-message.js'

const message = buildFlexMessage({ name: 'สมชาย', total: '380' })
await client.pushMessage({ to: USER_ID, messages: [message] })
```

## หมายเหตุ

- รูปแบบ **data URI** (จากการอัปโหลด) แสดงได้ใน preview เท่านั้น — การส่งเข้า LINE จริง รูปต้องอยู่บน HTTPS hosting
- icon จาก Lucide ใส่เป็น SVG URL ผ่าน Iconify CDN — แสดงใน preview ได้ทันที ส่วน production แนะนำแปลงเป็น PNG บน hosting ของคุณ
- การกด "ส่งเข้า LINE" จาก browser ตรงๆ อาจติด CORS ของ `api.line.me` — แอปมีคำสั่ง curl สำเร็จรูปให้คัดลอกไปรันแทน

## โครงสร้างโค้ด

```
src/
├── flex/          # โมเดล Flex Message: types, tree utils, binding, templates, export
├── renderer/      # FlexRender — แปลง flex JSON เป็น DOM (CSS flexbox) สำหรับ preview
├── components/    # UI: Toolbar, Palette, TreeView, Inspector, modals ต่างๆ
├── store.ts       # zustand store: document tree, selection, undo/redo, autosave
└── uiStore.ts     # สถานะ modal / icon picker / data panel
```
