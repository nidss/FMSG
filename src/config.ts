// ค่าเชื่อมต่อ Google Drive ที่ฝังมากับระบบ — ใช้ได้ทุกเครื่องทันทีโดยไม่ต้องตั้งค่า
// (Client ID ของ web OAuth เป็นค่า public โดยออกแบบ ความปลอดภัยอยู่ที่ authorized
// origins + consent screen ไม่ใช่ตัว ID)
// เครื่องไหนต้องการใช้ค่าอื่น แก้ได้ในแท็บ "ตั้งค่า" — ค่าที่แก้จะถูกเก็บเฉพาะเครื่องนั้น

export const DEFAULT_GDRIVE_CLIENT_ID =
  '384350918741-va3ppofcgd8jogv2h70ri3if2j6930d0.apps.googleusercontent.com'

export const DEFAULT_GDRIVE_FOLDER_ID = '1WoUcUOa_uCV53GKPGmyeUOpviRmQtStB'
