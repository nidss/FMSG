// Parse flex JSON pasted from anywhere (simulator, docs, code) into a
// loadable container, accepting several common wrapper shapes.

export interface PastedFlex {
  contents: any // bubble | carousel (plain JSON)
  altText?: string
}

function isContainer(o: any): boolean {
  return o && typeof o === 'object' && (o.type === 'bubble' || o.type === 'carousel')
}

export function parsePastedFlex(text: string): PastedFlex {
  let data: any
  try {
    data = JSON.parse(text.trim())
  } catch (e: any) {
    throw new Error('JSON ไม่ถูกต้อง: ' + (e.message ?? e))
  }

  // bubble / carousel ตรงๆ
  if (isContainer(data)) return { contents: data }

  // flex message เต็ม { type: 'flex', altText, contents }
  if (data?.type === 'flex' && isContainer(data.contents)) {
    return { contents: data.contents, altText: data.altText }
  }

  // push/reply payload { to?, messages: [...] } หรือ array ของ message
  const messages = Array.isArray(data) ? data : Array.isArray(data?.messages) ? data.messages : null
  if (messages) {
    const flex = messages.find((m: any) => m?.type === 'flex' && isContainer(m.contents))
    if (flex) return { contents: flex.contents, altText: flex.altText }
    const container = messages.find(isContainer)
    if (container) return { contents: container }
  }

  // { contents: bubble } เฉยๆ
  if (isContainer(data?.contents)) return { contents: data.contents, altText: data.altText }

  throw new Error('ไม่พบ bubble หรือ carousel ใน JSON นี้ — วางได้ทั้ง contents ตรงๆ หรือ message เต็มแบบ { "type": "flex", ... }')
}
