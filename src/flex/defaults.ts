import type { AnyNode, BoxNode, BubbleNode } from './types'
import { withUids } from './uid'

export type PaletteKind =
  | 'box-vertical'
  | 'box-horizontal'
  | 'box-baseline'
  | 'text'
  | 'image'
  | 'icon'
  | 'button'
  | 'separator'
  | 'filler'
  | 'span'
  | 'bubble'

export const PLACEHOLDER_IMAGE =
  'https://developers-resource.landpress.line.me/fx/img/01_1_cafe.png'

export const PLACEHOLDER_ICON =
  'https://api.iconify.design/lucide/star.svg?color=%23f5a623'

export function createNode(kind: PaletteKind): AnyNode {
  switch (kind) {
    case 'box-vertical':
      return withUids({ type: 'box', layout: 'vertical', contents: [] } as any)
    case 'box-horizontal':
      return withUids({ type: 'box', layout: 'horizontal', contents: [] } as any)
    case 'box-baseline':
      return withUids({ type: 'box', layout: 'baseline', contents: [] } as any)
    case 'text':
      return withUids({ type: 'text', text: 'ข้อความใหม่', wrap: true } as any)
    case 'span':
      return withUids({ type: 'span', text: 'span' } as any)
    case 'image':
      return withUids({
        type: 'image',
        url: PLACEHOLDER_IMAGE,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      } as any)
    case 'icon':
      return withUids({ type: 'icon', url: PLACEHOLDER_ICON, size: 'md' } as any)
    case 'button':
      return withUids({
        type: 'button',
        style: 'primary',
        action: { type: 'uri', label: 'ปุ่ม', uri: 'https://line.me' },
      } as any)
    case 'separator':
      return withUids({ type: 'separator', margin: 'md' } as any)
    case 'filler':
      return withUids({ type: 'filler' } as any)
    case 'bubble':
      return createEmptyBubble()
  }
}

export function createEmptyBubble(): BubbleNode {
  return withUids({
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [{ type: 'text', text: 'Hello, World!', size: 'lg', weight: 'bold' }],
    } as BoxNode,
  } as any)
}

/** Which component types a given parent accepts (for DnD validation). */
export function canContain(parent: AnyNode, childType: string): boolean {
  if (parent.type === 'carousel') return childType === 'bubble'
  if (parent.type === 'bubble') return false // blocks are added via dedicated UI
  if (parent.type === 'text') return childType === 'span'
  if (parent.type === 'box') {
    const box = parent as BoxNode
    if (childType === 'bubble' || childType === 'span') return false
    if (box.layout === 'baseline') {
      return ['icon', 'text', 'filler'].includes(childType)
    }
    return ['box', 'text', 'image', 'button', 'separator', 'filler'].includes(childType)
  }
  return false
}
