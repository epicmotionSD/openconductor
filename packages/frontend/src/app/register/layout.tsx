'use client'

import { Web3Provider } from '@/lib/web3'

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Web3Provider>{children}</Web3Provider>
}
