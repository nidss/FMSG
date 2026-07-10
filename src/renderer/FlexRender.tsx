import React, { useRef, useState } from 'react'
import type {
  AnyNode,
  BoxNode,
  BubbleNode,
  ButtonNode,
  CarouselNode,
  FlexComponent,
  IconNode,
  ImageNode,
  SeparatorNode,
  TextNode,
  TextSpanNode,
} from '../flex/types'
import { BUBBLE_WIDTH, IMAGE_SIZE, LINE_COLORS, SPACING, TEXT_SIZE, cssSize } from '../flex/constants'
import { useDesigner, type DropTarget } from '../store'
import { canContain } from '../flex/defaults'

/**
 * Renders a Flex Message tree using CSS flexbox, approximating LINE's renderer.
 * `display` is the (possibly data-bound) tree used for visuals, while `source`
 * is the editable tree — both share the same _uid values, so selection,
 * drag-and-drop and inline editing address the source tree.
 */

interface Ctx {
  interactive: boolean
}
const RenderCtx = React.createContext<Ctx>({ interactive: true })

// ---------- interaction helpers ----------

function useNodeInteraction(node: AnyNode) {
  const { interactive } = React.useContext(RenderCtx)
  const select = useDesigner((s) => s.select)
  const selectedUid = useDesigner((s) => s.selectedUid)
  const setDrag = useDesigner((s) => s.setDrag)
  if (!interactive) return { selected: false, props: {} as React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean } }
  const selected = selectedUid === node._uid
  const props: React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean } = {
    onClick: (e) => {
      e.stopPropagation()
      select(node._uid)
    },
    draggable: node.type !== 'bubble' && node.type !== 'carousel',
    onDragStart: (e) => {
      e.stopPropagation()
      setDrag({ kind: 'move', uid: node._uid })
      e.dataTransfer.effectAllowed = 'move'
      try {
        e.dataTransfer.setData('text/plain', node._uid)
      } catch {
        /* ok */
      }
    },
    onDragEnd: () => setDrag(null),
  }
  return { selected, props }
}

/** Drop behaviour for container boxes: computes insert index from pointer position. */
function useBoxDrop(node: BoxNode | CarouselNode) {
  const { interactive } = React.useContext(RenderCtx)
  const drag = useDesigner((s) => s.drag)
  const insertNew = useDesigner((s) => s.insertNew)
  const moveTo = useDesigner((s) => s.moveTo)
  const setDrag = useDesigner((s) => s.setDrag)
  const [hover, setHover] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  if (!interactive) return { ref, hover: null as number | null, props: {} }

  const acceptable = () => {
    if (!drag) return false
    if (drag.kind === 'new') {
      const t = drag.palette.startsWith('box-') ? 'box' : drag.palette
      return canContain(node, t)
    }
    return true // validated on drop
  }

  const computeIndex = (e: React.DragEvent): number => {
    const el = ref.current
    if (!el) return node.contents.length
    const horizontal = node.type === 'carousel' || (node as BoxNode).layout !== 'vertical'
    const children = Array.from(el.children).filter((c) => (c as HTMLElement).dataset.fxChild === '1')
    for (let i = 0; i < children.length; i++) {
      const r = children[i].getBoundingClientRect()
      const mid = horizontal ? r.left + r.width / 2 : r.top + r.height / 2
      const pos = horizontal ? e.clientX : e.clientY
      if (pos < mid) return i
    }
    return children.length
  }

  const props: React.HTMLAttributes<HTMLDivElement> = {
    onDragOver: (e) => {
      if (!acceptable()) return
      e.preventDefault()
      e.stopPropagation()
      setHover(computeIndex(e))
    },
    onDragLeave: (e) => {
      if (e.currentTarget === e.target) setHover(null)
    },
    onDrop: (e) => {
      if (!drag) return
      e.preventDefault()
      e.stopPropagation()
      const target: DropTarget = { parentUid: node._uid, index: computeIndex(e) }
      if (drag.kind === 'new') insertNew(drag.palette, target)
      else moveTo(drag.uid, target)
      setDrag(null)
      setHover(null)
    },
  }
  return { ref, hover, props }
}

// ---------- style helpers ----------

function marginStyle(node: any, horizontalParent: boolean): React.CSSProperties {
  const m = cssSize(node.margin, SPACING)
  if (!m) return {}
  return horizontalParent ? { marginLeft: m } : { marginTop: m }
}

function flexGrowStyle(node: any, parentLayout: string): React.CSSProperties {
  const def = parentLayout === 'horizontal' || parentLayout === 'baseline' ? 1 : 0
  const f = typeof node.flex === 'number' ? node.flex : def
  if (parentLayout === 'vertical') {
    return f > 0 ? { flexGrow: f, flexShrink: 0, flexBasis: 'auto' } : {}
  }
  return f > 0
    ? { flexGrow: f, flexShrink: 1, flexBasis: 0, minWidth: 0 }
    : { flexGrow: 0, flexShrink: 0 }
}

function offsetStyle(node: any): React.CSSProperties {
  const s: React.CSSProperties = {}
  if (node.position === 'absolute') s.position = 'absolute'
  const off = (v: string | undefined) => cssSize(v, SPACING)
  if (node.offsetTop) s.top = off(node.offsetTop)
  if (node.offsetBottom) s.bottom = off(node.offsetBottom)
  if (node.offsetStart) s.left = off(node.offsetStart)
  if (node.offsetEnd) s.right = off(node.offsetEnd)
  if (node.position !== 'absolute' && (node.offsetTop || node.offsetBottom || node.offsetStart || node.offsetEnd))
    s.position = 'relative'
  return s
}

const GRAVITY: Record<string, string> = { top: 'flex-start', bottom: 'flex-end', center: 'center' }

// ---------- components ----------

export function FlexMessageView({ node, interactive }: { node: BubbleNode | CarouselNode; interactive: boolean }) {
  return (
    <RenderCtx.Provider value={{ interactive }}>
      {node.type === 'carousel' ? <Carousel node={node} /> : <Bubble node={node} />}
    </RenderCtx.Provider>
  )
}

function Carousel({ node }: { node: CarouselNode }) {
  const { selected, props } = useNodeInteraction(node)
  const drop = useBoxDrop(node)
  return (
    <div
      ref={drop.ref}
      className={`fx-carousel${selected ? ' fx-selected' : ''}`}
      {...props}
      {...drop.props}
      draggable={false}
    >
      {node.contents.map((b, i) => (
        <React.Fragment key={b._uid}>
          {drop.hover === i && <div className="fx-drop-indicator fx-drop-v" />}
          <div data-fx-child="1" style={{ flexShrink: 0 }}>
            <Bubble node={b} />
          </div>
        </React.Fragment>
      ))}
      {drop.hover === node.contents.length && <div className="fx-drop-indicator fx-drop-v" />}
    </div>
  )
}

function Bubble({ node }: { node: BubbleNode }) {
  const { selected, props } = useNodeInteraction(node)
  const width = BUBBLE_WIDTH[node.size ?? 'mega'] ?? 300
  const styles = node.styles ?? {}
  const blockStyle = (name: 'header' | 'hero' | 'body' | 'footer'): React.CSSProperties => {
    const st = (styles as any)[name] ?? {}
    const css: React.CSSProperties = {}
    if (st.backgroundColor) css.backgroundColor = st.backgroundColor
    if (st.separator) css.borderTop = `1px solid ${st.separatorColor ?? '#e8e8e8'}`
    return css
  }
  return (
    <div
      className={`fx-bubble${selected ? ' fx-selected' : ''}`}
      style={{ width, direction: node.direction === 'rtl' ? 'rtl' : 'ltr' }}
      {...props}
      draggable={false}
    >
      {node.header && (
        <div className="fx-block fx-header" style={blockStyle('header')}>
          <Component node={node.header} parentLayout="block" />
        </div>
      )}
      {node.hero && (
        <div className="fx-block fx-hero" style={blockStyle('hero')}>
          <Component node={node.hero} parentLayout="hero" />
        </div>
      )}
      {node.body && (
        <div className="fx-block fx-body" style={blockStyle('body')}>
          <Component node={node.body} parentLayout="block" />
        </div>
      )}
      {node.footer && (
        <div className="fx-block fx-footer" style={blockStyle('footer')}>
          <Component node={node.footer} parentLayout="block" />
        </div>
      )}
      {!node.header && !node.hero && !node.body && !node.footer && (
        <div className="fx-empty-bubble">bubble ว่าง — เพิ่ม block ใน inspector</div>
      )}
    </div>
  )
}

function Component({ node, parentLayout }: { node: FlexComponent; parentLayout: string }) {
  switch (node.type) {
    case 'box':
      return <Box node={node} parentLayout={parentLayout} />
    case 'text':
      return <Text node={node} parentLayout={parentLayout} />
    case 'image':
      return <Image node={node} parentLayout={parentLayout} />
    case 'icon':
      return <Icon node={node} parentLayout={parentLayout} />
    case 'button':
      return <Button node={node} parentLayout={parentLayout} />
    case 'separator':
      return <Separator node={node} parentLayout={parentLayout} />
    case 'filler':
      return <div data-fx-child="1" style={{ flex: (node.flex ?? 1) + ' 1 0%' }} />
    default:
      return null
  }
}

function Box({ node, parentLayout }: { node: BoxNode; parentLayout: string }) {
  const { selected, props } = useNodeInteraction(node)
  const drop = useBoxDrop(node)
  const horizontal = node.layout !== 'vertical'
  const gap = cssSize(node.spacing, SPACING)

  const style: React.CSSProperties = {
    display: 'flex',
    position: 'relative',
    flexDirection: node.layout === 'vertical' ? 'column' : 'row',
    alignItems: node.layout === 'baseline' ? 'baseline' : (node.alignItems as any),
    justifyContent: node.justifyContent as any,
    gap,
    backgroundColor: node.backgroundColor,
    borderRadius: cssSize(node.cornerRadius, SPACING),
    width: node.width,
    height: node.height,
    ...marginStyle(node, parentLayout === 'horizontal' || parentLayout === 'baseline'),
    ...(parentLayout === 'block' || parentLayout === 'hero' ? {} : flexGrowStyle(node, parentLayout)),
    ...offsetStyle(node),
  }
  if (node.borderWidth) {
    style.border = `${cssSize(node.borderWidth, { none: 0, light: 0.5, normal: 1, medium: 2, 'semi-bold': 3, bold: 4 })} solid ${node.borderColor ?? '#000'}`
  }
  const pad = (v?: string) => cssSize(v, SPACING)
  if (node.paddingAll) style.padding = pad(node.paddingAll)
  if (node.paddingTop) style.paddingTop = pad(node.paddingTop)
  if (node.paddingBottom) style.paddingBottom = pad(node.paddingBottom)
  if (node.paddingStart) style.paddingLeft = pad(node.paddingStart)
  if (node.paddingEnd) style.paddingRight = pad(node.paddingEnd)

  const indicator = <div className={`fx-drop-indicator ${horizontal ? 'fx-drop-v' : 'fx-drop-h'}`} />

  return (
    <div
      ref={drop.ref}
      data-fx-child="1"
      className={`fx-box${selected ? ' fx-selected' : ''}${node.contents.length === 0 ? ' fx-box-empty' : ''}`}
      style={style}
      {...props}
      {...drop.props}
    >
      {node.contents.length === 0 && <span className="fx-box-hint">ลาก component มาวางที่นี่</span>}
      {node.contents.map((c, i) => (
        <React.Fragment key={c._uid}>
          {drop.hover === i && indicator}
          <Component node={c} parentLayout={node.layout} />
        </React.Fragment>
      ))}
      {drop.hover === node.contents.length && indicator}
    </div>
  )
}

function spanStyle(node: TextSpanNode): React.CSSProperties {
  return {
    fontSize: cssSize(node.size, TEXT_SIZE),
    color: node.color,
    fontWeight: node.weight === 'bold' ? 700 : undefined,
    fontStyle: node.style === 'italic' ? 'italic' : undefined,
    textDecoration: node.decoration,
  }
}

function Text({ node, parentLayout }: { node: TextNode; parentLayout: string }) {
  const { selected, props } = useNodeInteraction(node)
  const { interactive } = React.useContext(RenderCtx)
  const updateNode = useDesigner((s) => s.updateNode)
  const [editing, setEditing] = useState(false)

  const style: React.CSSProperties = {
    fontSize: cssSize(node.size, TEXT_SIZE, '14px'),
    color: node.color ?? LINE_COLORS.text,
    fontWeight: node.weight === 'bold' ? 700 : 400,
    fontStyle: node.style === 'italic' ? 'italic' : undefined,
    textDecoration: node.decoration,
    textAlign: node.align === 'end' ? 'right' : node.align === 'center' ? 'center' : 'left',
    lineHeight: 1.4,
    ...marginStyle(node, parentLayout === 'horizontal' || parentLayout === 'baseline'),
    ...flexGrowStyle(node, parentLayout),
    ...offsetStyle(node),
  }
  if (node.gravity && parentLayout === 'horizontal') style.alignSelf = GRAVITY[node.gravity]
  if (node.wrap) {
    style.whiteSpace = 'pre-wrap'
    style.overflowWrap = 'break-word'
  } else {
    style.whiteSpace = 'nowrap'
    style.overflow = 'hidden'
    style.textOverflow = 'ellipsis'
  }
  if (node.maxLines && node.wrap) {
    style.display = '-webkit-box'
    style.WebkitBoxOrient = 'vertical'
    style.WebkitLineClamp = node.maxLines
    style.whiteSpace = 'normal'
  }

  const commit = (e: React.FocusEvent<HTMLDivElement>) => {
    setEditing(false)
    const t = e.currentTarget.innerText
    if (t !== node.text) updateNode(node._uid, { text: t })
  }

  return (
    <div
      data-fx-child="1"
      className={`fx-text${selected ? ' fx-selected' : ''}${editing ? ' fx-editing' : ''}`}
      style={style}
      {...props}
      draggable={props.draggable && !editing}
      onDoubleClick={
        interactive && !node.contents?.length
          ? (e) => {
              e.stopPropagation()
              setEditing(true)
              const el = e.currentTarget as HTMLElement
              requestAnimationFrame(() => {
                el.focus()
                const sel = window.getSelection()
                if (sel && el.firstChild) sel.selectAllChildren(el)
              })
            }
          : undefined
      }
      contentEditable={editing}
      suppressContentEditableWarning
      onBlur={editing ? commit : undefined}
      onKeyDown={
        editing
          ? (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                ;(e.currentTarget as HTMLElement).blur()
              }
              if (e.key === 'Escape') (e.currentTarget as HTMLElement).blur()
              e.stopPropagation()
            }
          : undefined
      }
    >
      {node.contents?.length
        ? node.contents.map((s) => (
            <span key={s._uid} style={spanStyle(s)}>
              {s.text}
            </span>
          ))
        : node.text ?? ''}
    </div>
  )
}

function Image({ node, parentLayout }: { node: ImageNode; parentLayout: string }) {
  const { selected, props } = useNodeInteraction(node)
  const isHero = parentLayout === 'hero'
  const size = isHero ? '100%' : cssSize(node.size, IMAGE_SIZE, '100px')
  const ratio = (node.aspectRatio ?? (isHero ? '20:13' : '1:1')).split(':')
  const aspect = `${ratio[0]} / ${ratio[1] ?? 1}`
  const justify = node.align === 'start' ? 'flex-start' : node.align === 'end' ? 'flex-end' : 'center'

  const outer: React.CSSProperties = {
    display: 'flex',
    justifyContent: justify,
    ...marginStyle(node, parentLayout === 'horizontal' || parentLayout === 'baseline'),
    ...flexGrowStyle(node, parentLayout),
    ...offsetStyle(node),
  }
  if (node.gravity && parentLayout === 'horizontal') outer.alignSelf = GRAVITY[node.gravity]

  return (
    <div data-fx-child="1" className={`fx-image${selected ? ' fx-selected' : ''}`} style={outer} {...props}>
      <div
        style={{
          width: size,
          maxWidth: '100%',
          aspectRatio: aspect,
          backgroundColor: node.backgroundColor,
          backgroundImage: node.url ? `url("${node.url}")` : undefined,
          backgroundSize: node.aspectMode === 'fit' ? 'contain' : 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: 'inherit',
        }}
      >
        {!node.url && <div className="fx-img-placeholder">image</div>}
      </div>
    </div>
  )
}

function Icon({ node, parentLayout }: { node: IconNode; parentLayout: string }) {
  const { selected, props } = useNodeInteraction(node)
  const size = cssSize(node.size, TEXT_SIZE, '16px')
  const ratio = (node.aspectRatio ?? '1:1').split(':')
  return (
    <div
      data-fx-child="1"
      className={`fx-icon${selected ? ' fx-selected' : ''}`}
      style={{
        display: 'inline-block',
        width: `calc(${size} * ${(Number(ratio[0]) || 1) / (Number(ratio[1]) || 1)})`,
        height: size,
        backgroundImage: node.url ? `url("${node.url}")` : undefined,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        flexShrink: 0,
        transform: 'translateY(0.15em)',
        ...marginStyle(node, true),
      }}
      {...props}
    />
  )
}

function Button({ node, parentLayout }: { node: ButtonNode; parentLayout: string }) {
  const { selected, props } = useNodeInteraction(node)
  const style = node.style ?? 'link'
  const height = node.height === 'sm' ? 40 : 52
  const css: React.CSSProperties = {
    height,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer',
    userSelect: 'none',
    padding: '0 12px',
    ...marginStyle(node, parentLayout === 'horizontal' || parentLayout === 'baseline'),
    ...flexGrowStyle(node, parentLayout),
    ...offsetStyle(node),
  }
  if (node.gravity && parentLayout === 'horizontal') css.alignSelf = GRAVITY[node.gravity]
  if (style === 'primary') {
    css.backgroundColor = node.color ?? LINE_COLORS.primary
    css.color = '#ffffff'
  } else if (style === 'secondary') {
    css.backgroundColor = node.color ?? LINE_COLORS.secondary
    css.color = '#111111'
  } else {
    css.backgroundColor = 'transparent'
    css.color = node.color ?? LINE_COLORS.link
  }
  return (
    <div data-fx-child="1" className={`fx-button${selected ? ' fx-selected' : ''}`} style={css} {...props}>
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {node.action?.label ?? 'Button'}
      </span>
    </div>
  )
}

function Separator({ node, parentLayout }: { node: SeparatorNode; parentLayout: string }) {
  const { selected, props } = useNodeInteraction(node)
  const horizontal = parentLayout === 'horizontal' || parentLayout === 'baseline'
  return (
    <div
      data-fx-child="1"
      className={`fx-separator${selected ? ' fx-selected' : ''}`}
      style={{
        alignSelf: 'stretch',
        flexShrink: 0,
        ...(horizontal
          ? { borderLeft: `1px solid ${node.color ?? '#e8e8e8'}`, width: 1 }
          : { borderTop: `1px solid ${node.color ?? '#e8e8e8'}`, height: 1 }),
        ...marginStyle(node, horizontal),
      }}
      {...props}
    />
  )
}
