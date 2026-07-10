import React, { useRef } from 'react'
import { ArrowDown, ArrowUp, Copy, ImagePlus, Shapes, Trash2 } from 'lucide-react'
import { getSelectedNode, useDesigner } from '../store'
import { useUi } from '../uiStore'
import type { AnyNode, BubbleNode, FlexAction } from '../flex/types'
import { SIZE_KEYWORDS, SPACING_KEYWORDS } from '../flex/constants'
import { ColorField, Field, NumberField, SelectField, TextField, ToggleField } from './fields'

const MARGINS = SPACING_KEYWORDS
const IMAGE_SIZES = [...SIZE_KEYWORDS, 'full']

/** Downscale big uploads so data-URIs stay reasonably small. */
async function fileToDataUrl(file: File, maxDim = 1200): Promise<string> {
  const raw: string = await new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
  const img = document.createElement('img')
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = raw
  })
  if (Math.max(img.width, img.height) <= maxDim) return raw
  const scale = maxDim / Math.max(img.width, img.height)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85)
}

function UrlWithUpload({ node, prop, allowIconPicker }: { node: AnyNode; prop: string; allowIconPicker?: boolean }) {
  const updateNode = useDesigner((s) => s.updateNode)
  const openIconPicker = useUi((s) => s.openIconPicker)
  const fileRef = useRef<HTMLInputElement>(null)
  const url = (node as any)[prop] ?? ''
  return (
    <>
      <TextField label="URL รูปภาพ" value={url} onCommit={(v) => updateNode(node._uid, { [prop]: v })} multiline />
      <div className="btn-row">
        <button
          className="btn"
          onClick={() => fileRef.current?.click()}
          title="อัปโหลดรูปจากเครื่อง (แปลงเป็น data URI อัตโนมัติ)"
        >
          <ImagePlus size={14} /> อัปโหลดรูป
        </button>
        {allowIconPicker && (
          <button className="btn" onClick={() => openIconPicker(node._uid, prop)} title="เลือกจาก Lucide Icons">
            <Shapes size={14} /> Lucide Icons
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) updateNode(node._uid, { [prop]: await fileToDataUrl(f) })
          e.target.value = ''
        }}
      />
      {url.startsWith('data:') && (
        <div className="hint">
          ⚠️ รูปแบบ data URI ใช้ได้ใน preview เท่านั้น — ก่อนส่งเข้า LINE จริงต้องอัปโหลดรูปขึ้น hosting (HTTPS)
          แล้วเปลี่ยนเป็น URL
        </div>
      )}
    </>
  )
}

function ActionEditor({ node }: { node: AnyNode }) {
  const updateNode = useDesigner((s) => s.updateNode)
  const action: FlexAction | undefined = (node as any).action
  const setAction = (patch: Partial<FlexAction>) =>
    updateNode(node._uid, { action: { ...(action ?? { type: 'uri' }), ...patch } })
  const required = node.type === 'button'
  return (
    <div className="group">
      <div className="group-title">Action {required ? '' : '(ไม่บังคับ)'}</div>
      {!action && !required ? (
        <button className="btn" onClick={() => setAction({ type: 'uri', label: '', uri: 'https://' })}>
          + เพิ่ม action
        </button>
      ) : (
        <>
          <SelectField
            label="ประเภท"
            value={action?.type ?? 'uri'}
            options={['uri', 'message', 'postback']}
            allowEmpty={false}
            onCommit={(v) => setAction({ type: v as FlexAction['type'] })}
          />
          <TextField label="Label" value={action?.label ?? ''} onCommit={(v) => setAction({ label: v })} />
          {(action?.type ?? 'uri') === 'uri' && (
            <TextField label="URI" value={action?.uri ?? ''} onCommit={(v) => setAction({ uri: v })} />
          )}
          {action?.type === 'message' && (
            <TextField label="ข้อความที่จะส่ง" value={action?.text ?? ''} onCommit={(v) => setAction({ text: v })} />
          )}
          {action?.type === 'postback' && (
            <TextField label="Data" value={action?.data ?? ''} onCommit={(v) => setAction({ data: v })} />
          )}
          {!required && (
            <button className="btn danger" onClick={() => updateNode(node._uid, { action: null })}>
              ลบ action
            </button>
          )}
        </>
      )}
    </div>
  )
}

function CommonLayoutFields({ node }: { node: AnyNode }) {
  const updateNode = useDesigner((s) => s.updateNode)
  const u = (patch: any) => updateNode(node._uid, patch)
  return (
    <>
      <NumberField label="flex (สัดส่วนพื้นที่)" value={(node as any).flex} onCommit={(v) => u({ flex: v })} />
      <SelectField label="margin" value={(node as any).margin} options={MARGINS} onCommit={(v) => u({ margin: v })} />
    </>
  )
}

function BubbleInspector({ node }: { node: BubbleNode }) {
  const updateNode = useDesigner((s) => s.updateNode)
  const setBubbleBlock = useDesigner((s) => s.setBubbleBlock)
  const u = (patch: any) => updateNode(node._uid, patch)
  const blockDefaults: Record<string, any> = {
    header: { type: 'box', layout: 'vertical', contents: [{ type: 'text', text: 'Header', weight: 'bold' }] },
    hero: { type: 'image', url: '', size: 'full', aspectRatio: '20:13', aspectMode: 'cover' },
    body: { type: 'box', layout: 'vertical', contents: [{ type: 'text', text: 'Body' }] },
    footer: { type: 'box', layout: 'vertical', contents: [] },
  }
  return (
    <>
      <SelectField
        label="ขนาด bubble"
        value={node.size}
        options={['nano', 'micro', 'deca', 'hecto', 'kilo', 'mega', 'giga']}
        onCommit={(v) => u({ size: v })}
      />
      <div className="group">
        <div className="group-title">Blocks</div>
        <div className="btn-row wrap">
          {(['header', 'hero', 'body', 'footer'] as const).map((b) => (
            <button
              key={b}
              className={`btn${node[b] ? ' active' : ''}`}
              onClick={() => setBubbleBlock(node._uid, b, node[b] ? null : blockDefaults[b])}
            >
              {node[b] ? `− ${b}` : `+ ${b}`}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export function Inspector() {
  const node = useDesigner(getSelectedNode)
  const updateNode = useDesigner((s) => s.updateNode)
  const removeNode = useDesigner((s) => s.removeNode)
  const duplicateNode = useDesigner((s) => s.duplicateNode)
  const moveNode = useDesigner((s) => s.moveNode)
  const root = useDesigner((s) => s.root)
  const addBubbleToCarousel = useDesigner((s) => s.addBubbleToCarousel)

  if (!node) {
    return (
      <div className="inspector">
        <div className="panel-title">Properties</div>
        <div className="hint" style={{ margin: 12 }}>
          คลิก component ใน preview หรือ structure tree เพื่อแก้ไข property
          <br />
          <br />
          💡 ดับเบิลคลิกข้อความใน preview เพื่อแก้ข้อความได้ทันที
        </div>
      </div>
    )
  }

  const u = (patch: any) => updateNode(node._uid, patch)
  const isRoot = node._uid === (root as any)._uid

  return (
    <div className="inspector">
      <div className="panel-title">
        Properties — <b>{node.type}</b>
      </div>
      {!isRoot && (
        <div className="btn-row" style={{ padding: '8px 12px 0' }}>
          <button className="btn" title="เลื่อนขึ้น/ซ้าย" onClick={() => moveNode(node._uid, -1)}>
            <ArrowUp size={13} />
          </button>
          <button className="btn" title="เลื่อนลง/ขวา" onClick={() => moveNode(node._uid, 1)}>
            <ArrowDown size={13} />
          </button>
          <button className="btn" title="ทำสำเนา" onClick={() => duplicateNode(node._uid)}>
            <Copy size={13} />
          </button>
          <button className="btn danger" title="ลบ" onClick={() => removeNode(node._uid)}>
            <Trash2 size={13} />
          </button>
        </div>
      )}
      <div className="inspector-body">
        {node.type === 'carousel' && (
          <button className="btn" onClick={addBubbleToCarousel}>
            + เพิ่ม bubble ใน carousel
          </button>
        )}
        {node.type === 'bubble' && <BubbleInspector node={node as BubbleNode} />}

        {node.type === 'box' && (
          <>
            <SelectField
              label="layout"
              value={(node as any).layout}
              options={['vertical', 'horizontal', 'baseline']}
              allowEmpty={false}
              onCommit={(v) => u({ layout: v })}
            />
            <SelectField label="spacing (ระยะห่างลูก)" value={(node as any).spacing} options={SPACING_KEYWORDS} onCommit={(v) => u({ spacing: v })} />
            <SelectField
              label="justifyContent"
              value={(node as any).justifyContent}
              options={['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly']}
              onCommit={(v) => u({ justifyContent: v })}
            />
            <SelectField
              label="alignItems"
              value={(node as any).alignItems}
              options={['flex-start', 'center', 'flex-end']}
              onCommit={(v) => u({ alignItems: v })}
            />
            <ColorField label="สีพื้นหลัง" value={(node as any).backgroundColor} onCommit={(v) => u({ backgroundColor: v })} />
            <TextField label="cornerRadius (เช่น 8px)" value={(node as any).cornerRadius ?? ''} onCommit={(v) => u({ cornerRadius: v })} />
            <TextField label="paddingAll (เช่น 12px หรือ md)" value={(node as any).paddingAll ?? ''} onCommit={(v) => u({ paddingAll: v })} />
            <div className="grid2">
              <TextField label="paddingTop" value={(node as any).paddingTop ?? ''} onCommit={(v) => u({ paddingTop: v })} />
              <TextField label="paddingBottom" value={(node as any).paddingBottom ?? ''} onCommit={(v) => u({ paddingBottom: v })} />
              <TextField label="paddingStart" value={(node as any).paddingStart ?? ''} onCommit={(v) => u({ paddingStart: v })} />
              <TextField label="paddingEnd" value={(node as any).paddingEnd ?? ''} onCommit={(v) => u({ paddingEnd: v })} />
            </div>
            <div className="grid2">
              <TextField label="width" value={(node as any).width ?? ''} onCommit={(v) => u({ width: v })} />
              <TextField label="height" value={(node as any).height ?? ''} onCommit={(v) => u({ height: v })} />
            </div>
            <ColorField label="สีขอบ (borderColor)" value={(node as any).borderColor} onCommit={(v) => u({ borderColor: v })} />
            <SelectField
              label="ความหนาขอบ"
              value={(node as any).borderWidth}
              options={['none', 'light', 'normal', 'medium', 'semi-bold', 'bold']}
              onCommit={(v) => u({ borderWidth: v })}
            />
            <CommonLayoutFields node={node} />
            <ActionEditor node={node} />
          </>
        )}

        {node.type === 'text' && (
          <>
            <TextField label="ข้อความ (รองรับ {{binding}})" value={(node as any).text ?? ''} onCommit={(v) => u({ text: v })} multiline />
            <SelectField label="ขนาด" value={(node as any).size} options={SIZE_KEYWORDS} onCommit={(v) => u({ size: v })} />
            <ColorField label="สี" value={(node as any).color} onCommit={(v) => u({ color: v })} />
            <SelectField label="น้ำหนัก" value={(node as any).weight} options={['regular', 'bold']} onCommit={(v) => u({ weight: v })} />
            <SelectField label="align" value={(node as any).align} options={['start', 'center', 'end']} onCommit={(v) => u({ align: v })} />
            <SelectField label="gravity" value={(node as any).gravity} options={['top', 'center', 'bottom']} onCommit={(v) => u({ gravity: v })} />
            <ToggleField label="ตัดขึ้นบรรทัดใหม่ (wrap)" value={(node as any).wrap} onCommit={(v) => u({ wrap: v || undefined })} />
            <NumberField label="จำนวนบรรทัดสูงสุด" value={(node as any).maxLines} onCommit={(v) => u({ maxLines: v })} />
            <SelectField label="style" value={(node as any).style} options={['normal', 'italic']} onCommit={(v) => u({ style: v })} />
            <SelectField label="decoration" value={(node as any).decoration} options={['none', 'underline', 'line-through']} onCommit={(v) => u({ decoration: v })} />
            <CommonLayoutFields node={node} />
            <ActionEditor node={node} />
          </>
        )}

        {node.type === 'span' && (
          <>
            <TextField label="ข้อความ" value={(node as any).text ?? ''} onCommit={(v) => u({ text: v })} multiline />
            <SelectField label="ขนาด" value={(node as any).size} options={SIZE_KEYWORDS} onCommit={(v) => u({ size: v })} />
            <ColorField label="สี" value={(node as any).color} onCommit={(v) => u({ color: v })} />
            <SelectField label="น้ำหนัก" value={(node as any).weight} options={['regular', 'bold']} onCommit={(v) => u({ weight: v })} />
            <SelectField label="decoration" value={(node as any).decoration} options={['none', 'underline', 'line-through']} onCommit={(v) => u({ decoration: v })} />
          </>
        )}

        {node.type === 'image' && (
          <>
            <UrlWithUpload node={node} prop="url" allowIconPicker />
            <SelectField label="ขนาด" value={(node as any).size} options={IMAGE_SIZES} onCommit={(v) => u({ size: v })} />
            <TextField label="aspectRatio (เช่น 20:13)" value={(node as any).aspectRatio ?? ''} onCommit={(v) => u({ aspectRatio: v })} />
            <SelectField label="aspectMode" value={(node as any).aspectMode} options={['cover', 'fit']} onCommit={(v) => u({ aspectMode: v })} />
            <SelectField label="align" value={(node as any).align} options={['start', 'center', 'end']} onCommit={(v) => u({ align: v })} />
            <SelectField label="gravity" value={(node as any).gravity} options={['top', 'center', 'bottom']} onCommit={(v) => u({ gravity: v })} />
            <ColorField label="สีพื้นหลัง" value={(node as any).backgroundColor} onCommit={(v) => u({ backgroundColor: v })} />
            <CommonLayoutFields node={node} />
            <ActionEditor node={node} />
          </>
        )}

        {node.type === 'icon' && (
          <>
            <UrlWithUpload node={node} prop="url" allowIconPicker />
            <SelectField label="ขนาด" value={(node as any).size} options={SIZE_KEYWORDS} onCommit={(v) => u({ size: v })} />
            <TextField label="aspectRatio" value={(node as any).aspectRatio ?? ''} onCommit={(v) => u({ aspectRatio: v })} />
            <SelectField label="margin" value={(node as any).margin} options={MARGINS} onCommit={(v) => u({ margin: v })} />
          </>
        )}

        {node.type === 'button' && (
          <>
            <ActionEditor node={node} />
            <SelectField label="สไตล์" value={(node as any).style} options={['primary', 'secondary', 'link']} onCommit={(v) => u({ style: v })} />
            <ColorField label="สี" value={(node as any).color} onCommit={(v) => u({ color: v })} />
            <SelectField label="ความสูง" value={(node as any).height} options={['sm', 'md']} onCommit={(v) => u({ height: v })} />
            <SelectField label="gravity" value={(node as any).gravity} options={['top', 'center', 'bottom']} onCommit={(v) => u({ gravity: v })} />
            <CommonLayoutFields node={node} />
          </>
        )}

        {node.type === 'separator' && (
          <>
            <ColorField label="สี" value={(node as any).color} onCommit={(v) => u({ color: v })} />
            <SelectField label="margin" value={(node as any).margin} options={MARGINS} onCommit={(v) => u({ margin: v })} />
          </>
        )}

        {node.type === 'filler' && <NumberField label="flex" value={(node as any).flex} onCommit={(v) => u({ flex: v })} />}
      </div>
    </div>
  )
}
