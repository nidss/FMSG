// {{path.to.value}} data binding.

const RE = /\{\{\s*([\w.[\]-]+)\s*\}\}/g

export function lookup(data: any, path: string): any {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
  let cur = data
  for (const p of parts) {
    if (cur == null) return undefined
    cur = cur[p]
  }
  return cur
}

export function bindString(s: string, data: any): string {
  return s.replace(RE, (m, path) => {
    const v = lookup(data, path)
    return v === undefined || v === null ? m : String(v)
  })
}

/** Deep-clone a tree, substituting {{placeholders}} in every string value. */
export function bindTree<T>(node: T, data: any): T {
  const walk = (v: any): any => {
    if (typeof v === 'string') return bindString(v, data)
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') {
      const out: any = {}
      for (const [k, val] of Object.entries(v)) out[k] = walk(val)
      return out
    }
    return v
  }
  return walk(node)
}

/** Collect all placeholder paths used in the tree. */
export function collectPlaceholders(node: any): string[] {
  const found = new Set<string>()
  const walk = (v: any) => {
    if (typeof v === 'string') {
      for (const m of v.matchAll(RE)) found.add(m[1])
    } else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(node)
  return [...found].sort()
}
