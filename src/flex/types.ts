// LINE Flex Message types (subset used by the designer).
// Every node carries an internal `_uid` which is stripped on export.

export type UID = string

export interface BaseNode {
  _uid: UID
  type: string
  [key: string]: any
}

export interface FlexAction {
  type: 'uri' | 'message' | 'postback'
  label?: string
  uri?: string
  text?: string
  data?: string
}

export interface TextSpanNode extends BaseNode {
  type: 'span'
  text: string
  size?: string
  color?: string
  weight?: string
  style?: string
  decoration?: string
}

export interface TextNode extends BaseNode {
  type: 'text'
  text?: string
  contents?: TextSpanNode[]
  size?: string
  color?: string
  weight?: 'regular' | 'bold'
  style?: 'normal' | 'italic'
  decoration?: 'none' | 'underline' | 'line-through'
  align?: 'start' | 'end' | 'center'
  gravity?: 'top' | 'bottom' | 'center'
  wrap?: boolean
  maxLines?: number
  flex?: number
  margin?: string
  lineSpacing?: string
  action?: FlexAction
}

export interface ImageNode extends BaseNode {
  type: 'image'
  url: string
  size?: string
  aspectRatio?: string
  aspectMode?: 'cover' | 'fit'
  backgroundColor?: string
  align?: 'start' | 'end' | 'center'
  gravity?: 'top' | 'bottom' | 'center'
  margin?: string
  flex?: number
  action?: FlexAction
}

export interface IconNode extends BaseNode {
  type: 'icon'
  url: string
  size?: string
  aspectRatio?: string
  margin?: string
}

export interface ButtonNode extends BaseNode {
  type: 'button'
  action: FlexAction
  style?: 'primary' | 'secondary' | 'link'
  color?: string
  height?: 'sm' | 'md'
  flex?: number
  margin?: string
  gravity?: 'top' | 'bottom' | 'center'
}

export interface SeparatorNode extends BaseNode {
  type: 'separator'
  margin?: string
  color?: string
}

export interface FillerNode extends BaseNode {
  type: 'filler'
  flex?: number
}

export interface BoxNode extends BaseNode {
  type: 'box'
  layout: 'vertical' | 'horizontal' | 'baseline'
  contents: FlexComponent[]
  spacing?: string
  margin?: string
  paddingAll?: string
  paddingTop?: string
  paddingBottom?: string
  paddingStart?: string
  paddingEnd?: string
  backgroundColor?: string
  cornerRadius?: string
  borderColor?: string
  borderWidth?: string
  width?: string
  height?: string
  flex?: number
  justifyContent?: string
  alignItems?: string
  action?: FlexAction
  position?: 'relative' | 'absolute'
  offsetTop?: string
  offsetBottom?: string
  offsetStart?: string
  offsetEnd?: string
}

export type FlexComponent =
  | BoxNode
  | TextNode
  | ImageNode
  | IconNode
  | ButtonNode
  | SeparatorNode
  | FillerNode

export interface BlockStyle {
  backgroundColor?: string
  separator?: boolean
  separatorColor?: string
}

export interface BubbleNode extends BaseNode {
  type: 'bubble'
  size?: 'nano' | 'micro' | 'deca' | 'hecto' | 'kilo' | 'mega' | 'giga'
  direction?: 'ltr' | 'rtl'
  header?: BoxNode
  hero?: ImageNode | BoxNode
  body?: BoxNode
  footer?: BoxNode
  styles?: {
    header?: BlockStyle
    hero?: BlockStyle
    body?: BlockStyle
    footer?: BlockStyle
  }
}

export interface CarouselNode extends BaseNode {
  type: 'carousel'
  contents: BubbleNode[]
}

export type FlexContainer = BubbleNode | CarouselNode
export type AnyNode = FlexContainer | FlexComponent | TextSpanNode

export const BUBBLE_BLOCKS = ['header', 'hero', 'body', 'footer'] as const
export type BubbleBlock = (typeof BUBBLE_BLOCKS)[number]
