
/**
 * 
 * 
 * @param {number} amount - Transaction amount (e.g. 150)
 * @param {number} [nonce=1] - Counter to prevent replay attacks
 * @returns {string} The raw string to pass to the QR renderer
 */
export function getMockQRString(amount = 150, nonce = 1, receiverId = "unknown") {
  const timestamp = Math.floor(Date.now() / 1000);

  const mockEscrowId = "esc_99182";
  const mockLockedAmount = 2000;

  // 32-byte Ed25519 Public Key -> 44 chars in Base64
  const authenticBuyerPublicKey = "u9+jP6Z1mH2oR8xG5cK4vL3fN2sA7wB9qE4pT1zO5vM=";

  // 64-byte Ed25519 Signature -> 88 chars in Base64
  const authenticServerSignature = "L8K4vL3fN2sA7wB9qE4pT1zO5vMu9+jP6Z1mH2oR8xG5cK4vL3fN2sA7wB9qE4pT1zO5vMu9+jP6Z1mH2oR8xG5cA==";

  // 64-byte Ed25519 Signature -> 88 chars in Base64
  const authenticBuyerSignature = "MEYCIQDxX91gH7c3K4vL3fN2sA7wB9qE4pT1zO5vMu9+jP6Z1mH2oR8xG5cK4vL3fN2sA7wB9qE4pT1zO5vMu9+A==";

  // 2. Build Transaction Block: amount|nonce|timestamp|receiverId.signature
  const txData = `${amount}|${nonce}|${timestamp}|${receiverId}`;
  const txBlock = `${txData}.${authenticBuyerSignature}`;

  // 3. Build Server Certificate: escrow_id|locked_amount|buyer_public_key.signature
  const certData = `${mockEscrowId}|${mockLockedAmount}|${authenticBuyerPublicKey}`;
  const serverCert = `${certData}.${authenticServerSignature}`;

  // 4. Final composite string separated by '~'
  return `${txBlock}~${serverCert}`;
}
