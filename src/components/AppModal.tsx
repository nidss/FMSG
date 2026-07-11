import React from 'react'
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog'
import { Layout, LayoutContent } from '@astryxdesign/core/Layout'

/** Shared modal shell on top of Astryx Dialog. Render only while open. */
export function AppModal({
  title,
  subtitle,
  width,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  width?: number | string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <Dialog isOpen onOpenChange={(open) => !open && onClose()} width={width} maxHeight="88vh">
      <Layout
        header={<DialogHeader title={title} subtitle={subtitle} onOpenChange={(open) => !open && onClose()} />}
        content={<LayoutContent>{children}</LayoutContent>}
      />
    </Dialog>
  )
}
