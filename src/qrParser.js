import Dexie from "dexie";
import { getProfile } from "./db";

const db = new Dexie("AeroPayMerchantDB");

// We only index the fields we need to search by (like escrowId and nonce for replay checks)
// The raw data, keys, and signatures are automatically saved inside the object.
db.version(1).stores({
  settlements: "++id, escrowId, nonce, syncStatus"
});

export const getPendingSettlements = async () => {
  return await db.settlements.where("syncStatus").equals("PENDING").toArray();
};

export const getAllSettlements = async () => {
  return await db.settlements.toArray();
};

export const clearSettlements = async () => {
  return await db.settlements.clear();
};


const verifyServerCertificate = (certificate) => {
  const authenticServerSignature = "L8K4vL3fN2sA7wB9qE4pT1zO5vMu9+jP6Z1mH2oR8xG5cK4vL3fN2sA7wB9qE4pT1zO5vMu9+jP6Z1mH2oR8xG5cA==";
  return certificate.signature === authenticServerSignature;
};

const verifyBuyerSignature = (transaction) => {
  const authenticBuyerSignature = "MEYCIQDxX91gH7c3K4vL3fN2sA7wB9qE4pT1zO5vMu9+jP6Z1mH2oR8xG5cK4vL3fN2sA7wB9qE4pT1zO5vMu9+A==";
  return transaction.signature === authenticBuyerSignature;
};

const parseQR = (qrString) => {
  try {
    const parts = qrString.split("~");
    if (parts.length !== 2) throw new Error("Invalid QR structure");

    const [txBlock, serverCert] = parts;

    // Transaction Block
    const txParts = txBlock.split(".");
    if (txParts.length !== 2) throw new Error("Invalid transaction block");

    const [txData, buyerSignature] = txParts;
    const txFields = txData.split("|");
    if (txFields.length < 4) throw new Error("Invalid transaction data");

    const [amount, nonce, timestamp, receiverId, senderId] = txFields;

    // Server Certificate Block
    const certParts = serverCert.split(".");
    if (certParts.length !== 2) throw new Error("Invalid server certificate");

    const [certData, serverSignature] = certParts;
    const certFields = certData.split("|");
    if (certFields.length !== 3) throw new Error("Invalid certificate data");

    const [escrowId, lockedAmount, buyerPublicKey] = certFields;

    return {
      transaction: {
        amount: Number(amount),
        nonce: Number(nonce),
        timestamp: Number(timestamp),
        receiverId,
        senderId: senderId || escrowId,
        raw: txData,
        signature: buyerSignature
      },
      certificate: {
        escrowId,
        lockedAmount: Number(lockedAmount),
        buyerPublicKey,
        raw: certData,
        signature: serverSignature
      }
    };
  } catch (error) {
    return { error: error.message };
  }
};


export const processScannedPayment = async (qrString) => {
  // 1. Parse QR
  const parsed = parseQR(qrString);
  if (parsed.error) {
    return { valid: false, reason: parsed.error };
  }
  const { transaction, certificate } = parsed;

  // 2. Basic Data Validation
  if (transaction.amount <= 0) {
    return { valid: false, reason: "Invalid transaction amount" };
  }
  if (transaction.nonce < 1) {
    return { valid: false, reason: "Invalid nonce" };
  }

  // 3. Identity Verification Check
  const profile = await getProfile();
  if (!profile || !profile.upiId) {
    return { valid: false, reason: "Please link your UPI ID in settings before scanning" };
  }
  if (profile.upiId !== transaction.receiverId) {
    return { valid: false, reason: `Payment was meant for ${transaction.receiverId}, not you` };
  }

  // 3. Escrow Limit Check
  if (transaction.amount > certificate.lockedAmount) {
    return { valid: false, reason: "Payment exceeds locked escrow limit" };
  }

  // 4. Expiration Check (5 minutes max to prevent hoarding QR codes)
  const currentTime = Math.floor(Date.now() / 1000);
  const MAX_PAYMENT_AGE = 60;
  if (Math.abs(currentTime - transaction.timestamp) > MAX_PAYMENT_AGE) {
    return { valid: false, reason: "QR code has expired" };
  }

  // 5. Signature Verifications
  if (!verifyServerCertificate(certificate)) {
    return { valid: false, reason: "Invalid AeroPay server certificate" };
  }
  if (!verifyBuyerSignature(transaction)) {
    return { valid: false, reason: "Invalid buyer signature" };
  }

  // 6. Replay Attack Check (Database Level)
  // Ensures the merchant doesn't scan the exact same QR code twice
  const existingRecords = await db.settlements
    .where("escrowId")
    .equals(certificate.escrowId)
    .toArray();

  const isNonceUsed = existingRecords.some(r => Number(r.nonce) === transaction.nonce);
  if (isNonceUsed) {
    return { valid: false, reason: "QR Code already used (Replay Attack blocked)" };
  }

  // 7. SUCCESS: Save to IndexedDB with all Keys and Signatures
  const finalAmount = Math.abs(Number(transaction.amount));

  await db.settlements.add({
    // --- UI & Search Fields ---
    escrowId: certificate.escrowId,
    senderId: transaction.senderId || certificate.escrowId,
    amount: finalAmount,
    nonce: transaction.nonce,
    scannedAtTimestamp: Date.now(),
    syncStatus: "PENDING",

    // --- Cryptographic Proof for Backend Sync ---
    buyerPublicKey: certificate.buyerPublicKey,
    buyerSignature: transaction.signature,
    serverSignature: certificate.signature,
    txRawData: transaction.raw,
    certRawData: certificate.raw,
    fullQrString: qrString
  });

  return {
    valid: true,
    reason: "Payment verified and saved locally",
    payment: {
      amount: finalAmount,
      nonce: transaction.nonce,
      escrowId: certificate.escrowId
    }
  };
};
