'use client'

import { ReactNode } from 'react'

interface CommandCenterLayoutProps {
  children: ReactNode
}

export default function CommandCenterLayout({ children }: CommandCenterLayoutProps) {
  return (
    <div className="h-full">
      {children}
    </div>
  )
}
