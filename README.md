# 🛡️ AirdropLens: Multi-Chain Wallet Auditor (MVP)

AirdropLens is a high-integrity Web3 tool designed to audit wallet eligibility for major airdrops using **real-time on-chain data**. Unlike most trackers, this tool performs direct RPC calls to verify contract interactions.

## 🚀 Key Capabilities
- **Real Data Engine:** Queries Alchemy RPCs for live Nonce, Balance, and Transaction history.
- **Protocol-Level Checks:**
  - **Base Official Bridge:** Verifies L1 -> L2 deposits.
  - **Aerodrome Finance:** Checks for swap/LP history on Base.
  - **Uniswap (Multi-Chain):** Audits activity on both Ethereum Mainnet and Base.
  - **ENS Identity:** Checks for `.eth` domain ownership as a human verification signal.
- **Sybil Risk Heuristics:** Calculates a 0-100 risk score based on wallet age and "dust" balance detection.
- **Live Gas Monitor:** Real-time fee tracking for Ethereum and Base.

## 🛠️ Tech Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Web3:** Wagmi, Viem, RainbowKit
- **Provider:** Alchemy (JSON-RPC)

## ⚠️ Current MVP Limitations (Opportunities for Buyers)
1. **Bulk Scan:** The UI currently resolves and validates multiple addresses but displays results for the first valid address in the list. 
   - *Fix:* Buyer can implement a map-loop to render multiple result sets or a CSV export.
2. **API Keys:** Currently using a public fallback Alchemy key. 
   - *Fix:* Move to `.env` variables for production rate limits.
3. **Data Depth:** Current checks verify *if* an interaction happened.
   - *Expansion:* Integrate indexers (Covalent/Goldsky) to calculate exact USD volume.

## 📦 Installation & Setup
1. `npm install`
2. `npm run dev`

## 💰 Monetization Paths
This MVP is ready to be expanded into a **SaaS model** (charging for bulk Sybil audits) or an **Affiliate Tool** (linking users to bridges/DEXs they haven't used yet).