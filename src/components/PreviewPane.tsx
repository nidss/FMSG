import React, { useMemo } from 'react'
import { useDesigner } from '../store'
import { FlexMessageView } from '../renderer/FlexRender'
import { bindTree } from '../flex/binding'
import type { FlexContainer } from '../flex/types'

/**
 * Chat-style live preview. When binding mode is on, the rendered tree has
 * {{placeholders}} substituted — uids are preserved so editing still works.
 */
export function PreviewPane() {
  const root = useDesigner((s) => s.root)
  const select = useDesigner((s) => s.select)
  const bindingEnabled = useDesigner((s) => s.bindingEnabled)
  const dataText = useDesigner((s) => s.dataText)

  const display: FlexContainer = useMemo(() => {
    if (!bindingEnabled) return root
    try {
      return bindTree(root, JSON.parse(dataText))
    } catch {
      return root
    }
  }, [root, bindingEnabled, dataText])

  return (
    <div className="preview-pane" onClick={() => select(null)}>
      <div className="chat-bg">
        <div className="chat-row">
          <div className="chat-avatar">🤖</div>
          <FlexMessageView node={display} interactive />
        </div>
        <div className="preview-tip">
          คลิกเพื่อเลือก · ดับเบิลคลิกข้อความเพื่อแก้ · ลาก component มาวางได้เลย
          {bindingEnabled && <b> · โหมดแสดงข้อมูลจริง (binding) เปิดอยู่</b>}
        </div>
      </div>
    </div>
  )
}
