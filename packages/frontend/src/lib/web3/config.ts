import { http, createConfig } from 'wagmi'
import { baseSepolia, base } from 'wagmi/chains'
import { injected, metaMask, coinbaseWallet, walletConnect } from 'wagmi/connectors'

// Contract addresses
export const ERC8004_ADDRESS = {
  [baseSepolia.id]: '0xf8d7044d657b602194fb5745c614beb35d5d898a' as `0x${string}`,
  [base.id]: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: mainnet deployment
} as const

// WalletConnect project ID - get from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

export const config = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({ appName: 'OpenConductor' }),
    walletConnect({ projectId }),
  ],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [base.id]: http('https://mainnet.base.org'),
  },
})

// Default to Base Sepolia for now
export const DEFAULT_CHAIN = baseSepolia
