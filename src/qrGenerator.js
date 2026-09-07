/**
 * Generates the QR string containing both the transaction block and the server certificate.
 *
 * @param {number} amount - Transaction amount (e.g. 150)
 * @param {number} [nonce=1] - Counter to prevent replay attacks
 * @param {string} [receiverId="unknown"] - Receiver's UPI ID
 * @param {string|object} [senderId=null] - Sender's UPI ID or escrowData object
 * @param {object} [escrowData=null] - Dynamic escrow certificate & keypair from API / IndexedDB
 * @returns {string} The raw string to pass to the QR renderer
 */
export function getMockQRString(amount = 150, nonce = 1, receiverId = "unknown", senderId = null, escrowData = null) {
  // Support either (amount, nonce, receiverId, senderId, escrowData) or (amount, nonce, receiverId, escrowData)
  if (senderId && typeof senderId === "object" && !escrowData) {
    escrowData = senderId;
    senderId = escrowData?.upiId || null;
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // Dynamic Escrow & Crypto credentials from API / IndexedDB
  const escrowId = escrowData?.escrowId || "esc_99182";
  const lockedAmount = escrowData?.lockedAmount || 2000;
  const authenticBuyerPublicKey = escrowData?.publicKey || "u9+jP6Z1mH2oR8xG5cK4vL3fN2sA7wB9qE4pT1zO5vM=";
  const authenticServerSignature = escrowData?.serverSignature || "L8K4vL3fN2sA7wB9qE4pT1zO5vMu9+jP6Z1mH2oR8xG5cK4vL3fN2sA7wB9qE4pT1zO5vMu9+jP6Z1mH2oR8xG5cA==";

  // 64-byte Ed25519 Buyer Transaction Signature
  const authenticBuyerSignature = "MEYCIQDxX91gH7c3K4vL3fN2sA7wB9qE4pT1zO5vMu9+jP6Z1mH2oR8xG5cK4vL3fN2sA7wB9qE4pT1zO5vMu9+A==";

  // Sender UPI ID to transmit in the transaction block so the receiver can display who sent the money
  const finalSenderId = senderId || escrowData?.upiId || "";

  // 2. Build Transaction Block: amount|nonce|timestamp|receiverId(|senderId).signature
  const txData = finalSenderId
    ? `${amount}|${nonce}|${timestamp}|${receiverId}|${finalSenderId}`
    : `${amount}|${nonce}|${timestamp}|${receiverId}`;
  const txBlock = `${txData}.${authenticBuyerSignature}`;

  // 3. Build Server Certificate: certData.serverSignature
  // certData is escrow_id|locked_amount|buyer_public_key
  const certData = escrowData?.certData || `${escrowId}|${lockedAmount}|${authenticBuyerPublicKey}`;
  const serverCert = `${certData}.${authenticServerSignature}`;

  // 4. Final composite string separated by '~'
  return `${txBlock}~${serverCert}`;
}
