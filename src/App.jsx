import { useState } from "react";
import QRCode from "react-qr-code";
import { savePayment, getNextNonce } from "./db";
import { getMockQRString } from "./qrGenerator";
import "./App.css";

export default function AeroPayScreen() {
    const [activeTab, setActiveTab] = useState("scan");
    const [amount, setAmount] = useState("");
    const [receiverId, setReceiverId] = useState("");
    const [qrData, setQrData] = useState("");

    const handlePay = async () => {
        if (!amount || !receiverId) {
            alert("Please enter an amount and ID.");
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
                        onClick={() => setActiveTab("scan")}
                    >
                        Scan
                    </button>
                    <button
                        className={`toggle-btn ${activeTab === "qrcode" ? "active" : ""}`}
                        onClick={() => setActiveTab("qrcode")}
                    >
                        Pay
                    </button>
                </div>

                {/* White Box Divider */}
                <div className="main-content-box">
                    {activeTab === "qrcode" && (
                        <div className="pay-form">
                            <input
                                type="text"
                                inputMode="decimal"
                                className="line-input amount-input"
                                placeholder="0.0"
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
                                <div className="qr-container">
                                    <QRCode value={qrData} size={180} />
                                </div>
                            )}
                            <button className="generate-pay-btn" onClick={handlePay}>Pay</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}