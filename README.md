# Solana Token Creation CLI

This project provides a CLI tool to create SPL tokens on Solana, upload metadata to IPFS (Pinata), and register on-chain metadata using Metaplex.

## Features

- Interactive CLI for token details
- Secure keypair management
- Metadata upload to IPFS via Pinata
- On-chain metadata registration
- Full TypeScript, robust error handling

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Yarn](https://yarnpkg.com/) or npm
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- A funded Solana devnet wallet
- [Pinata account](https://pinata.cloud/) and JWT token

## Setup

1. **Clone the repository:**

   ```sh
   git clone https://github.com/dastageer-eth/create-token-solana.git
   cd create-token-solana
   ```

2. **Install dependencies:**

   ```sh
   yarn install
   # or
   npm install
   ```

3. **Create a .env file:**

   ```sh
   cp .env.example .env
   # Then edit .env and add your Pinata JWT token
   ```

   Example `.env`:

   ```env
   PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Generate a Solana keypair for testing:**

   ```sh
   solana-keygen new --outfile test/keys/id.json --no-bip39-passphrase --force
   # Fund this keypair on devnet using the Solana faucet or CLI
   solana airdrop 2 $(solana-keygen pubkey test/keys/id.json) --url https://api.devnet.solana.com
   ```

5. **Run the CLI:**
   ```sh
   npx ts-node test/testCreateToken.ts
   # or
   npx tsx test/testCreateToken.ts
   ```

## Notes

- The CLI will prompt for all required token details and validate your input.
- Metadata is uploaded to IPFS via Pinata using your JWT token.
- The keypair in `test/keys/id.json` is used for all transactions. **Never commit real mainnet keys!**
- All sensitive files and keys are gitignored by default.

## Troubleshooting

- Ensure your `.env` is set up and your keypair is funded.
- For Pinata errors, check your JWT and Pinata account limits.
- For Solana errors, check your devnet balance and network status.

## License

Unlicensed
