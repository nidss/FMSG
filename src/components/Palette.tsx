import {
  Box,
  Columns2,
  Image,
  Italic,
  Minus,
  MousePointerClick,
  Rows2,
  Space,
  Star,
  Type,
} from 'lucide-react'
import { useDesigner } from '../store'
import type { PaletteKind } from '../flex/defaults'

const ITEMS: Array<{ kind: PaletteKind; label: string; icon: any }> = [
  { kind: 'box-vertical', label: 'Box แนวตั้ง', icon: Rows2 },
  { kind: 'box-horizontal', label: 'Box แนวนอน', icon: Columns2 },
  { kind: 'box-baseline', label: 'Box baseline', icon: Box },
  { kind: 'text', label: 'Text', icon: Type },
  { kind: 'image', label: 'Image', icon: Image },
  { kind: 'icon', label: 'Icon', icon: Star },
  { kind: 'button', label: 'Button', icon: MousePointerClick },
  { kind: 'separator', label: 'Separator', icon: Minus },
  { kind: 'filler', label: 'Filler', icon: Space },
  { kind: 'span', label: 'Span (ใน text)', icon: Italic },
]

export function Palette() {
  const setDrag = useDesigner((s) => s.setDrag)
  return (
    <div className="palette">
      <div className="panel-title">Components — ลากไปวางใน preview หรือ tree</div>
      <div className="palette-grid">
        {ITEMS.map(({ kind, label, icon: Icon }) => (
          <div
            key={kind}
            className="palette-item"
            draggable
            onDragStart={(e) => {
              setDrag({ kind: 'new', palette: kind })
              e.dataTransfer.effectAllowed = 'copy'
              try {
                e.dataTransfer.setData('text/plain', `new:${kind}`)
              } catch {
                /* ok */
              }
            }}
            onDragEnd={() => setDrag(null)}
            title={label}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
