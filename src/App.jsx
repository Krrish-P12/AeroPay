import { useState } from "react";
import QRCode from "react-qr-code";
import { savePayment, getNextNonce } from "./db";
import { getMockQRString } from "./qrGenerator";
import { processScannedPayment } from "./qrParser";
import QRScanner from "./Scanner";
import "./App.css";

export default function AeroPayScreen() {
    const [activeTab, setActiveTab] = useState("scan");
    const [amount, setAmount] = useState("");
    const [receiverId, setReceiverId] = useState("");
    const [qrData, setQrData] = useState("");
    const [scanResult, setScanResult] = useState("");
    const [isScanning, setIsScanning] = useState(false);

    const handlePay = async () => {
        if (!amount || !receiverId) {
            alert("Please enter an amount and ID.");
            return;
        }

        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            alert("Please enter a valid positive number for the amount.");
            return;
        }
        if (numAmount > 500) {
            alert("Maximum payment amount is 500 at a time.");
            return;
        }

        const nonce = await getNextNonce(receiverId);

        try {
            await savePayment(receiverId, amount, nonce);
            
            // Generate the QR string
            const generatedQrString = getMockQRString(Number(amount), nonce);
            setQrData(generatedQrString);
            
            alert("Payment saved successfully!");
            // Leaving inputs filled so the user knows what the generated QR code is for
        } catch (error) {
            console.error("Failed to save payment:", error);
            alert("Error saving payment.");
        }
    };

    return (
        <div className="aeropay-screen">
            {/* wordmark */}
            <p className="aeropay-logo">AeroPAY</p>

            {/* Main Content Area */}
            <div className="tab-wrapper">
                {/* Toggle Switch */}
                <div className="toggle-container">
                    <button
                        className={`toggle-btn ${activeTab === "scan" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("scan");
                            setIsScanning(false);
                        }}
                    >
                        Scan
                    </button>
                    <button
                        className={`toggle-btn ${activeTab === "qrcode" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("qrcode");
                            setIsScanning(false);
                        }}
                    >
                        Pay
                    </button>
                </div>

                {/* White Box Divider */}
                <div className="main-content-box">
                    {activeTab === "scan" && (
                        <div className={`pay-form ${isScanning ? 'has-qr' : ''}`}>
                            {isScanning ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                    <div className="qr-container">
                                    <QRScanner 
                                        onScan={async (data) => {
                                            setScanResult(data);
                                            const result = await processScannedPayment(data);
                                            
                                            if (!result.valid) {
                                                alert(`Scan Failed: ${result.reason}`);
                                            }
                                            
                                            setIsScanning(false);
                                        }} 
                                    />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ flex: 1 }}></div>
                            )}
                            {!isScanning && (
                                <button 
                                    className="generate-pay-btn" 
                                    onClick={() => setIsScanning(true)}
                                >
                                    Scan
                                </button>
                            )}
                        </div>
                    )}
                    {activeTab === "qrcode" && (
                        <div className={`pay-form ${qrData ? 'has-qr' : ''}`}>
                            <input
                                type="text"
                                inputMode="decimal"
                                className="line-input amount-input"
                                placeholder="₹ 0.0"
                                value={amount}
                                onChange={(e) => {
                                    setAmount(e.target.value);
                                    setQrData("");
                                }}
                            />
                            <input
                                type="text"
                                className="line-input id-input"
                                placeholder="id"
                                value={receiverId}
                                onChange={(e) => {
                                    setReceiverId(e.target.value);
                                    setQrData(""); // Clear QR when ID changes
                                }}
                            />
                            {qrData && (
                                <div className="qr-container" style={{ marginTop: '20px' }}>
                                    <QRCode 
                                        value={qrData} 
                                        size={256}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    />
                                </div>
                            )}
                            {qrData ? (
                                <button className="generate-pay-btn" onClick={() => {
                                    setAmount("");
                                    setReceiverId("");
                                    setQrData("");
                                }}>Cancel</button>
                            ) : (
                                <button className="generate-pay-btn" onClick={handlePay}>Pay</button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}