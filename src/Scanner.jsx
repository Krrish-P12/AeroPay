import { Scanner } from '@yudiel/react-qr-scanner';
import { useState } from 'react';

export default function QRScanner({ onScan, onClose }) {
    const [isSuccess, setIsSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {!isSuccess ? (
                <Scanner
                    onScan={async (detectedCodes) => {
                        if (isProcessing) return;
                        
                        if (detectedCodes && detectedCodes.length > 0) {
                            setIsProcessing(true);
                            const rawString = detectedCodes[0].rawValue;
                            
                            // Await validation from the parent
                            const success = await onScan(rawString);
                            
                            if (success) {
                                setIsSuccess(true); // Trigger success UI
                                
                                // Wait 1 second before closing the scanner
                                setTimeout(() => {
                                    if (onClose) onClose();
                                }, 1000);
                            } else {
                                // If validation failed, let them scan again
                                setIsProcessing(false);
                            }
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
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <p style={{
                        fontFamily: '"Instrument Serif", serif',
                        fontStyle: 'italic',
                        fontSize: '28px',
                        color: '#000',
                        margin: '16px 0 0 0'
                    }}>Payment Received</p>
                </div>
            )}
        </div>
    );
}