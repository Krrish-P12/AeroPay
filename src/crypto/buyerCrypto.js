const encoder = new TextEncoder();

/**
 * Generate an Ed25519 key pair locally.
 *
 * IMPORTANT:
 * The private key NEVER goes to the server.
 */
export async function generateBuyerKeyPair() {
    if (!window.crypto?.subtle) {
        throw new Error("Web Crypto API is not available");
    }

    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "Ed25519"
        },
        true,
        ["sign", "verify"]
    );

    return keyPair;
}

/**
 * Convert ArrayBuffer → Base64
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

/**
 * Convert Base64 → Uint8Array
 */
function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Export buyer public key as Base64.
 *
 * This is the key that can be sent to the server.
 */
export async function exportBuyerPublicKey(publicKey) {
    const rawKey = await window.crypto.subtle.exportKey(
        "raw",
        publicKey
    );

    return arrayBufferToBase64(rawKey);
}

/**
 * Export buyer private key as Base64 (PKCS#8).
 * Useful if storing locally in secure storage or db.
 */
export async function exportBuyerPrivateKey(privateKey) {
    const pkcs8Key = await window.crypto.subtle.exportKey(
        "pkcs8",
        privateKey
    );

    return arrayBufferToBase64(pkcs8Key);
}

/**
 * Import a Base64 private key (PKCS#8).
 */
export async function importBuyerPrivateKey(privateKeyBase64) {
    const rawKey = base64ToUint8Array(privateKeyBase64);

    return await window.crypto.subtle.importKey(
        "pkcs8",
        rawKey,
        {
            name: "Ed25519"
        },
        true,
        ["sign"]
    );
}

/**
 * Sign arbitrary transaction data using
 * the buyer's PRIVATE key.
 */
export async function signTransaction(
    transactionData,
    privateKey
) {
    const data = encoder.encode(transactionData);

    const signature = await window.crypto.subtle.sign(
        {
            name: "Ed25519"
        },
        privateKey,
        data
    );

    return arrayBufferToBase64(signature);
}

/**
 * Import a Base64 public key.
 *
 * This will also be useful later on the RECEIVER side.
 */
export async function importBuyerPublicKey(
    publicKeyBase64
) {
    const rawKey = base64ToUint8Array(publicKeyBase64);

    return await window.crypto.subtle.importKey(
        "raw",
        rawKey,
        {
            name: "Ed25519"
        },
        true,
        ["verify"]
    );
}

/**
 * Verify a buyer signature.
 *
 * Used later by receiver.
 */
export async function verifyBuyerSignature(
    transactionData,
    signatureBase64,
    publicKey
) {
    const data = encoder.encode(transactionData);

    const signature = base64ToUint8Array(signatureBase64);

    return await window.crypto.subtle.verify(
        {
            name: "Ed25519"
        },
        publicKey,
        signature,
        data
    );
}
