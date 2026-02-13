# PayAgent — AI Commerce with AP2 Authorization + x402 Settlement

Multi-agent AI system implementing the full [AP2 protocol](https://ap2-protocol.org/) (Google) for autonomous digital commerce with [x402](https://www.x402.org/) (Coinbase) payment settlement on [SKALE](https://skale.space/).

## AP2 Flow

```
User: "I need weather data for my app"
         │
         ▼
[Shopping Agent]        → IntentMandate   (what the user wants)
         │
         ▼
[Merchant Agent]        → CartMandate     (signed JWT, what the merchant offers)
         │
         ▼
[Credentials Provider]  → PaymentMandate  (user authorization)
         │
         ▼
[Payment Processor]     → Receipt         (x402 settlement on SKALE + audit trail)
```

## Architecture

```
src/
├── ap2/                    # AP2 Protocol Core
│   ├── types.ts            # IntentMandate, CartMandate, PaymentMandate, Receipt
│   ├── validation.ts       # Mandate validation, expiry, chain verification
│   └── signing.ts          # JWT signing/verification (jose)
│
├── agents/                 # 4 AP2 Agents
│   ├── shopping-agent.ts   # Intent capture → IntentMandate
│   ├── merchant-agent.ts   # Catalog + CartMandate (JWT-signed)
│   ├── credentials-provider.ts  # Wallet + PaymentMandate
│   └── payment-processor.ts     # x402 settlement + Receipt
│
├── app/                    # Next.js 14 Dashboard
│   ├── page.tsx            # Trade page (Uniswap-style centered card + chat)
│   ├── flow/page.tsx       # AP2 Flow Tracker (4-step timeline)
│   ├── receipts/page.tsx   # Receipt Explorer with audit trails
│   └── api/                # API routes (orchestrate, confirm, merchants, receipts)
│
├── components/             # UI components
└── lib/                    # Utilities (AI wrapper, SKALE config, store)

contracts/
└── contracts/ReceiptRegistry.sol   # On-chain receipt registry (SKALE)
```

## Quick Start

```bash
# Install
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Key Features

- **Complete AP2 Flow**: Intent → Cart (JWT-signed) → Payment → Receipt with full audit trail
- **4 Separated Agents**: Each agent has one role, communicates via mandates
- **Failure Mode**: "Simulate Failure" button shows expired cart handling (required by track)
- **Auditable Receipts**: JSON receipts with step-by-step audit trail + on-chain hash
- **x402 Settlement**: Payment via x402 protocol on SKALE Base Sepolia (zero gas)
- **Uniswap-style UI**: Clean, minimal, centered card interface

## Network

| Element | Value |
|---------|-------|
| Chain | SKALE Base Sepolia |
| Chain ID | 324705682 |
| RPC | https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha |
| Explorer | https://base-sepolia-testnet-explorer.skalenodes.com/ |
| Axios USD | 0x61a26022927096f444994dA1e53F0FD9487EAfcf |
| Gas | sFUEL (free) |

## Stack

- **Framework**: Next.js 14 + TypeScript + Tailwind CSS
- **AI**: Claude API (@anthropic-ai/sdk)
- **AP2**: Custom TypeScript implementation (faithful to Google spec)
- **Signing**: jose (JWT HS256)
- **Wallet**: ethers.js v6
- **Blockchain**: SKALE Base Sepolia (zero gas)
- **Payment**: x402 protocol

## Track

Best Integration of AP2 — San Francisco Agentic Commerce x402 Hackathon

## License

MIT
