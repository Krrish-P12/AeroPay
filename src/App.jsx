import { useState } from "react";
import "./App.css";

export default function AeroPayScreen() {
    const [activeTab, setActiveTab] = useState("scan");

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
                            />
                            <input 
                                type="text" 
                                className="line-input id-input" 
                                placeholder="id"
                            />
                            <button className="generate-pay-btn">Pay</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}