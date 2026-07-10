import React, { useState } from 'react'
import {
  Box,
  ChevronDown,
  ChevronRight,
  Copy,
  Image,
  Italic,
  LayoutTemplate,
  Minus,
  MousePointerClick,
  MessageSquare,
  Space,
  Star,
  Trash2,
  Type,
  GalleryHorizontalEnd,
} from 'lucide-react'
import type { AnyNode, BubbleNode } from '../flex/types'
import { useDesigner, type DropTarget } from '../store'
import { canContain } from '../flex/defaults'

const ICONS: Record<string, any> = {
  bubble: MessageSquare,
  carousel: GalleryHorizontalEnd,
  box: Box,
  text: Type,
  span: Italic,
  image: Image,
  icon: Star,
  button: MousePointerClick,
  separator: Minus,
  filler: Space,
  block: LayoutTemplate,
}

function nodeLabel(node: AnyNode): string {
  switch (node.type) {
    case 'box':
      return `box · ${(node as any).layout}`
    case 'text':
      return `text · ${((node as any).text ?? '').slice(0, 20) || '(spans)'}`
    case 'span':
      return `span · ${((node as any).text ?? '').slice(0, 16)}`
    case 'button':
      return `button · ${(node as any).action?.label ?? ''}`
    case 'bubble':
      return `bubble${(node as any).size ? ` · ${(node as any).size}` : ''}`
    default:
      return node.type
  }
}

/** Children of a node as [labelPrefix, node] pairs (bubble blocks get labels). */
function childrenOf(node: AnyNode): Array<{ prefix?: string; node: AnyNode }> {
  if (node.type === 'bubble') {
    const b = node as BubbleNode
    const out: Array<{ prefix?: string; node: AnyNode }> = []
    for (const k of ['header', 'hero', 'body', 'footer'] as const) {
      if (b[k]) out.push({ prefix: k, node: b[k] as AnyNode })
    }
    return out
  }
  const contents = (node as any).contents
  if (Array.isArray(contents)) return contents.map((c: AnyNode) => ({ node: c }))
  return []
}

function TreeNode({ node, depth, prefix }: { node: AnyNode; depth: number; prefix?: string }) {
  const [open, setOpen] = useState(true)
  const selectedUid = useDesigner((s) => s.selectedUid)
  const select = useDesigner((s) => s.select)
  const removeNode = useDesigner((s) => s.removeNode)
  const duplicateNode = useDesigner((s) => s.duplicateNode)
  const setDrag = useDesigner((s) => s.setDrag)
  const drag = useDesigner((s) => s.drag)
  const insertNew = useDesigner((s) => s.insertNew)
  const moveTo = useDesigner((s) => s.moveTo)
  const [dropPos, setDropPos] = useState<'before' | 'inside' | 'after' | null>(null)

  const children = childrenOf(node)
  const hasChildren = children.length > 0
  const Icon = ICONS[node.type] ?? Box
  const selected = selectedUid === node._uid
  const isRoot = depth === 0
  const isBlock = prefix !== undefined // bubble block (header/hero/body/footer)

  const acceptsInside = (childType: string) => canContain(node, childType)

  const dragType = (): string | null => {
    if (!drag) return null
    if (drag.kind === 'new') return drag.palette.startsWith('box-') ? 'box' : drag.palette
    return null // move: validated in store
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!drag) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = (e.clientY - rect.top) / rect.height
    let pos: 'before' | 'inside' | 'after'
    const t = dragType()
    const canInside = t === null ? true : acceptsInside(t)
    if (canInside && (y > 0.3 && y < 0.7)) pos = 'inside'
    else pos = y < 0.5 ? 'before' : 'after'
    // root/blocks can't have siblings inserted via tree
    if ((isRoot || isBlock) && pos !== 'inside') {
      if (!canInside) return
      pos = 'inside'
    }
    e.preventDefault()
    e.stopPropagation()
    setDropPos(pos)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (!drag || !dropPos) return
    e.preventDefault()
    e.stopPropagation()
    let target: DropTarget | null = null
    if (dropPos === 'inside') {
      target = { parentUid: node._uid, index: null }
    } else {
      // sibling insert: need parent uid + index — resolved by store via moveTo/insertNew with parent lookup
      const info = (window as any).__treeParentMap?.[node._uid]
      if (info) target = { parentUid: info.parentUid, index: dropPos === 'before' ? info.index : info.index + 1 }
    }
    if (target) {
      if (drag.kind === 'new') insertNew(drag.palette, target)
      else moveTo(drag.uid, target)
    }
    setDrag(null)
    setDropPos(null)
  }

  return (
    <div className="tree-node">
      <div
        className={`tree-row${selected ? ' selected' : ''}${dropPos ? ` drop-${dropPos}` : ''}`}
        style={{ paddingLeft: depth * 14 + 6 }}
        onClick={(e) => {
          e.stopPropagation()
          select(node._uid)
        }}
        draggable={!isRoot && !isBlock}
        onDragStart={(e) => {
          e.stopPropagation()
          setDrag({ kind: 'move', uid: node._uid })
          e.dataTransfer.effectAllowed = 'move'
        }}
        onDragEnd={() => setDrag(null)}
        onDragOver={handleDragOver}
        onDragLeave={() => setDropPos(null)}
        onDrop={handleDrop}
      >
        <span
          className="tree-caret"
          onClick={(e) => {
            e.stopPropagation()
            setOpen(!open)
          }}
        >
          {hasChildren ? (open ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <span style={{ width: 12 }} />}
        </span>
        <Icon size={13} className="tree-icon" />
        <span className="tree-label">
          {prefix && <b className="tree-prefix">{prefix}: </b>}
          {nodeLabel(node)}
        </span>
        {!isRoot && (
          <span className="tree-actions">
            {!isBlock && (
              <button
                title="ทำสำเนา"
                onClick={(e) => {
                  e.stopPropagation()
                  duplicateNode(node._uid)
                }}
              >
                <Copy size={12} />
              </button>
            )}
            <button
              title="ลบ"
              onClick={(e) => {
                e.stopPropagation()
                removeNode(node._uid)
              }}
            >
              <Trash2 size={12} />
            </button>
          </span>
        )}
      </div>
      {open &&
        children.map(({ prefix: p, node: c }, i) => {
          // record parent info for sibling drops
          ;((window as any).__treeParentMap ??= {})[c._uid] = p
            ? { parentUid: node._uid, index: 0, block: p }
            : { parentUid: node._uid, index: i }
          return <TreeNode key={c._uid} node={c} depth={depth + 1} prefix={p} />
        })}
    </div>
  )
}

export function TreeView() {
  const root = useDesigner((s) => s.root)
  return (
    <div className="tree">
      <div className="panel-title">Structure</div>
      <TreeNode node={root} depth={0} />
    </div>
  )
}
