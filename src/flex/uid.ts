import type { AnyNode } from './types'

let counter = 0
export function newUid(): string {
  counter += 1
  return `n${Date.now().toString(36)}${counter.toString(36)}`
}

const CHILD_KEYS = ['contents', 'header', 'hero', 'body', 'footer'] as const

/** Deep-clone a plain flex JSON tree and assign a fresh _uid to every node. */
export function withUids<T>(node: T): T {
  const clone = JSON.parse(JSON.stringify(node))
  visit(clone, (n) => {
    n._uid = newUid()
  })
  return clone
}

/** Deep-clone and remove all internal _uid fields (for export). */
export function stripUids<T>(node: T): T {
  const clone = JSON.parse(JSON.stringify(node))
  visit(clone, (n) => {
    delete n._uid
  })
  return clone
}

/** Visit every node object (things with a `type` field) in the tree. */
export function visit(node: any, fn: (n: any) => void): void {
  if (!node || typeof node !== 'object') return
  if (typeof node.type === 'string') fn(node)
  for (const key of CHILD_KEYS) {
    const child = (node as any)[key]
    if (Array.isArray(child)) child.forEach((c) => visit(c, fn))
    else if (child && typeof child === 'object') visit(child, fn)
  }
}

export type NodePath = Array<string | number>

/** Find the path (sequence of keys/indexes) from root to the node with the given uid. */
export function findPath(root: AnyNode, uid: string): NodePath | null {
  if ((root as any)._uid === uid) return []
  for (const key of CHILD_KEYS) {
    const child = (root as any)[key]
    if (Array.isArray(child)) {
      for (let i = 0; i < child.length; i++) {
        const sub = findPath(child[i], uid)
        if (sub) return [key, i, ...sub]
      }
    } else if (child && typeof child === 'object') {
      const sub = findPath(child, uid)
      if (sub) return [key, ...sub]
    }
  }
  return null
}

export function getAtPath(root: any, path: NodePath): any {
  let cur = root
  for (const p of path) cur = cur?.[p]
  return cur
}

export function findNode(root: AnyNode, uid: string): AnyNode | null {
  const path = findPath(root, uid)
  if (path === null) return null
  return getAtPath(root, path)
}

/** Returns [parentNode, keyOrIndexInfo] for a uid, or null for the root. */
export function findParent(
  root: AnyNode,
  uid: string,
): { parent: AnyNode; key: string; index: number | null } | null {
  const path = findPath(root, uid)
  if (!path || path.length === 0) return null
  const last = path[path.length - 1]
  if (typeof last === 'number') {
    const key = path[path.length - 2] as string
    const parent = getAtPath(root, path.slice(0, -2))
    return { parent, key, index: last }
  }
  const parent = getAtPath(root, path.slice(0, -1))
  return { parent, key: last as string, index: null }
}
