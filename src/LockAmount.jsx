import { useState, useEffect, useCallback } from "react";
import { generateBuyerKeyPair, exportBuyerPublicKey, exportBuyerPrivateKey } from "./crypto/buyerCrypto";
import { saveEscrowLock, getProfile } from "./db";
import { requestEscrowLock } from "./services/escrowApi";

export default function LockAmount({ onClose }) {
    const [upiId, setUpiId] = useState("");
    const [amount, setAmount] = useState("");
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isLocking, setIsLocking] = useState(false);
    const [savedEscrow, setSavedEscrow] = useState(null);
    const [isIdVerified, setIsIdVerified] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            const profile = await getProfile();
            if (profile?.escrowId) {
                let resolvedAmount = profile.lockedAmount;
                if (!resolvedAmount && profile.certData) {
                    const parts = profile.certData.split('|');
                    if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
                        resolvedAmount = Number(parts[1]);
                    }
                }
                const updatedProfile = {
                    ...profile,
                    lockedAmount: resolvedAmount || 0
                };
                setSavedEscrow(updatedProfile);

                if (!profile.lockedAmount && resolvedAmount) {
                    await saveEscrowLock({ lockedAmount: resolvedAmount });
                }
            }
            if (profile?.upiId) {
                setUpiId(profile.upiId);
                setIsIdVerified(true);
            }
        };
        loadProfile();
    }, []);

    const checkConnectivity = useCallback(async () => {
        if (!navigator.onLine) {
            setIsOnline(false);
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            await fetch(`https://www.google.com/favicon.ico?_=${Date.now()}`, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            setIsOnline(true);
        } catch {
            setIsOnline(false);
        }
    }, []);

    useEffect(() => {
        checkConnectivity();

        const handleOnline = () => checkConnectivity();
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check periodically every 3 seconds to catch changes even with virtual adapters
        const interval = setInterval(checkConnectivity, 3000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [checkConnectivity]);

    const handleLock = async () => {
        if (!isOnline || isLocking) return;
        
        const profile = await getProfile();
        if (!profile?.upiId) {
            alert("Security check: Please verify your UPI ID in Setup before locking funds.");
            return;
        }

        if (upiId !== profile.upiId) {
            alert("Security error: You cannot lock escrow on someone else's UPI ID.");
            return;
        }

        if (!amount) {
            alert("Please enter an amount to lock.");
            return;
        }

        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            alert("Please enter a valid positive amount.");
            return;
        }

        try {
            setIsLocking(true);

            // 1. Generate Ed25519 KeyPair locally on this device
            const keyPair = await generateBuyerKeyPair();

            // 2. Export Public Key (Safe to send to server / online API)
            const publicKeyBase64 = await exportBuyerPublicKey(keyPair.publicKey);

            // 3. Export Private Key (Must stay on device to sign offline payments)
            const privateKeyBase64 = await exportBuyerPrivateKey(keyPair.privateKey);

            // 4. Send Public Key to Online Express API to Lock Escrow
            const apiResult = await requestEscrowLock({
                userId: upiId,
                lockedAmount: numAmount,
                buyerPublicKeyBase64: publicKeyBase64
            });

            const finalLockedAmount = Number(apiResult.lockedAmount || numAmount);

            // 5. Store both keys and returned escrow certificate into IndexedDB
            await saveEscrowLock({
                upiId,
                publicKey: publicKeyBase64,
                privateKey: privateKeyBase64,
                escrowId: apiResult.escrowId,
                lockedAmount: finalLockedAmount,
                certData: apiResult.certData,
                serverSignature: apiResult.serverSignature
            });

            setSavedEscrow({
                upiId,
                escrowId: apiResult.escrowId,
                lockedAmount: finalLockedAmount
            });

            alert(`Amount locked successfully!\n\nEscrow ID: ${apiResult.escrowId}\nLocked: ₹${amount}\nLinked UPI: ${upiId}`);

            setAmount("");
        } catch (error) {
            console.error("Failed to lock escrow:", error);
            alert("Error: " + error.message);
        } finally {
            setIsLocking(false);
        }
    };

    return (
        <div className="aeropay-screen">
            <p className="settings-header">Lock Amount</p>
            <div className="back-icon" onClick={onClose}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </div>

            <div className="tab-wrapper">
                {/* Spacer to match the height of the toggle on the main screen */}
                <div style={{ height: '46px', marginBottom: '-1px', flexShrink: 0 }}></div>
                <div className="main-content-box" style={{ background: 'transparent', border: 'none', boxShadow: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
                    <div className="pay-form">
                        {savedEscrow?.escrowId ? (
                            <div style={{ marginBottom: '30px', textAlign: 'center', color: '#fff', fontFamily: 'sans-serif' }}>
                                <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>Active Escrow</p>
                                <p style={{ margin: '5px 0 0 0', fontSize: '1.4rem', color: '#ffffffff', fontWeight: 'bold' }}>{savedEscrow.escrowId}</p>
                                <p style={{ margin: '15px 0 0 0', fontSize: '1.2rem', color: '#22c55e', fontWeight: '600' }}>Locked Limit: ₹{savedEscrow.lockedAmount}</p>
                                <p style={{ opacity: 0.7, margin: '6px 0 0 0', fontSize: '0.9rem' }}>Linked to: {savedEscrow.upiId}</p>
                                <p style={{ opacity: 0.5, margin: '15px 0 0 0', fontSize: '0.8rem' }}>Offline payment limit is actively locked to this device.</p>
                            </div>
                        ) : !isIdVerified ? (
                            <div style={{ marginBottom: '30px', textAlign: 'center', color: '#fff', fontFamily: 'sans-serif' }}>
                                <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>Setup Required</p>
                                <p style={{ margin: '15px 0 0 0', fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>Link Your ID First</p>
                                <p style={{ opacity: 0.6, margin: '10px 0 0 0', fontSize: '0.85rem' }}>
                                    You must verify your UPI ID and PIN in <strong>Setup</strong> before locking offline funds.
                                </p>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    className="line-input id-input settings-input"
                                    placeholder="UPI ID"
                                    value={upiId}
                                    readOnly
                                    style={{ opacity: 0.8, cursor: 'default' }}
                                />
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="line-input id-input settings-input"
                                    placeholder="Amount"
                                    value={amount}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                            setAmount(val);
                                        }
                                    }}
                                />

                                <button
                                    className="generate-pay-btn"
                                    onClick={handleLock}
                                    disabled={!isOnline || isLocking}
                                    style={{
                                        background: '#333333',
                                        color: isOnline && !isLocking ? '#ffffff' : '#777777',
                                        border: isOnline ? '2px solid #ffffffff' : '2px solid transparent',
                                        cursor: isOnline && !isLocking ? 'pointer' : 'not-allowed',
                                        boxShadow: 'none',
                                        transition: 'border-color 0.2s ease, color 0.2s ease'
                                    }}
                                >
                                    {isLocking ? "Locking..." : "Lock"}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
