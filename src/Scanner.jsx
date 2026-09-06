import { Scanner } from '@yudiel/react-qr-scanner';
import { useState } from 'react';

export default function QRScanner({ onScan }) {
    const [isSuccess, setIsSuccess] = useState(false);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {!isSuccess ? (
                <Scanner
                    onScan={(detectedCodes) => {
                        if (detectedCodes && detectedCodes.length > 0) {
                            const rawString = detectedCodes[0].rawValue;
                            setIsSuccess(true); // Trigger success UI
                            
                            // Wait 1 second before passing data to main app
                            setTimeout(() => {
                                onScan(rawString);
                            }, 1000);
                        }
                    }}
                    onError={(error) => {
                        console.error("QR Scanner Error:", error?.message);
                    }}
                    components={{ finder: false }}
                    styles={{
                        container: { width: "100%", height: "100%", borderRadius: "16px", overflow: "hidden" },
                        video: { objectFit: "cover" }
                    }}
                />
            ) : (
                <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '16px'
                }}>
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
            )}
        </div>
    );
}