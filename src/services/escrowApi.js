/**
 * Mock Online Express API client for AeroPay Escrow Lock.
 * Simulates POST /api/escrow/lock
 *
 * When your backend is deployed, simply update BACKEND_URL and use the real fetch call.
 */

const BACKEND_URL = null; // Set e.g. "https://api.aeropay.com" when live

export async function requestEscrowLock({ userId, lockedAmount, buyerPublicKeyBase64 }) {
    if (!navigator.onLine) {
        throw new Error("Cannot lock amount while offline. Please connect to the internet.");
    }

    // If a live backend URL is configured, call it
    if (BACKEND_URL) {
        const response = await fetch(`${BACKEND_URL}/api/escrow/lock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, lockedAmount, buyerPublicKeyBase64 })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || "Failed to lock amount on server");
        }
        return data;
    }

    // Otherwise, simulate the Express /api/escrow/lock endpoint locally
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network latency

    const randomHex = Math.random().toString(16).substring(2, 10);
    const escrowId = `esc_${randomHex}`;
    const certData = `${escrowId}|${lockedAmount}|${buyerPublicKeyBase64}`;

    // Standard mock server Ed25519 signature matching the receiver verification requirement
    const mockServerSignature = "L8K4vL3fN2sA7wB9qE4pT1zO5vMu9+jP6Z1mH2oR8xG5cK4vL3fN2sA7wB9qE4pT1zO5vMu9+jP6Z1mH2oR8xG5cA==";

    return {
        success: true,
        escrowId,
        certData,
        serverSignature: mockServerSignature,
        lockedAmount: Number(lockedAmount),
        userId
    };
}
