# AeroPay

AeroPay is a peer-to-peer payment application designed to function entirely offline. It enables secure transactions between devices without an internet connection by using cryptographically signed QR codes.

## How It Works

1. **Pay**: The sender enters an amount and a recipient ID. The app generates a transaction payload containing a sequential nonce, timestamp, and a digital signature (Ed25519). This payload is encoded into a high-density QR code.
2. **Scan**: The receiver scans the QR code. The app unpacks the payload, validates the cryptographic signatures, and performs local checks for escrow limits, expiration (60-second TTL), and replay attacks.
3. **Settle**: Valid transactions are securely stored in a local IndexedDB ledger and flagged as pending. Once the device regains internet connectivity, the local ledger is synced with the backend for final settlement.

## Tech Stack

- React (Vite)
- IndexedDB (Dexie.js) for local ledger storage
- `@yudiel/react-qr-scanner` for optical transfer

## Development

Install dependencies and start the local dev server:

```bash
npm install
npm run dev
```
