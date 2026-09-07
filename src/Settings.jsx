import { useState, useEffect } from "react";
import { saveProfile, getProfile } from "./db";

export default function Settings({ onClose }) {
    const [upiId, setUpiId] = useState("");
    const [pin, setPin] = useState("");
    const [savedId, setSavedId] = useState("");

    useEffect(() => {
        // Load the currently linked ID if it exists
        const loadProfile = async () => {
            const stored = await getProfile();
            if (stored) setSavedId(stored.upiId);
        };
        loadProfile();
    }, []);

    const handleVerify = async () => {
        if (!upiId) {
            alert("Please enter a UPI ID.");
            return;
        }

        // Mocking the Bank API verification call
        if (pin === "1234") {
            await saveProfile(upiId);
            setSavedId(upiId);
            alert(`Verified! Your device is now securely linked to ${upiId}`);
            setPin(""); // Clear the PIN after success
        } else {
            alert("Verification failed: Invalid PIN. You cannot claim this ID.");
        }
    };

    return (
        <div className="aeropay-screen">
            <p className="settings-header">Setup</p>
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

                        {savedId ? (
                            <div style={{ marginBottom: '30px', textAlign: 'center', color: '#fff', fontFamily: 'sans-serif' }}>
                                <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>Linked Account</p>
                                <p style={{ margin: '5px 0 0 0', fontSize: '1.4rem', color: '#ffffffff', fontWeight: 'bold' }}>{savedId}</p>
                                <p style={{ opacity: 0.5, margin: '15px 0 0 0', fontSize: '0.8rem' }}>This device is securely locked to this ID.</p>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    className="line-input id-input settings-input"
                                    placeholder="UPI ID"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                />
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    className="line-input id-input settings-input"
                                    placeholder="4-Digit PIN"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                />

                                <button
                                    className="generate-pay-btn"
                                    onClick={handleVerify}
                                >
                                    Verify & Link
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
