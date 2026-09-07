import { useState, useEffect } from "react";
import { getHistory } from "./db";
import { getAllSettlements } from "./qrParser";

export default function History({ onClose }) {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        async function fetchData() {
            // Fetch sent payments
            const sent = await getHistory(); // From AeroPayUserDB
            // Fetch received payments
            const received = await getAllSettlements(); // From AeroPayMerchantDB

            // Format Sent Payments
            const formattedSent = sent.map(tx => {
                const dateObj = new Date(tx.timestamp);
                const dd = String(dateObj.getDate()).padStart(2, '0');
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const yyyy = dateObj.getFullYear();
                return {
                    id: `sent_${tx.id}`,
                    date: `${dd}-${mm}-${yyyy}`,
                    timeVal: tx.timestamp,
                    name: tx.receiverId,
                    amount: Math.abs(tx.amount),
                    type: 'sent'
                };
            });

            // Format Received Payments
            const formattedReceived = received.map(tx => {
                const dateObj = new Date(tx.scannedAtTimestamp);
                const dd = String(dateObj.getDate()).padStart(2, '0');
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const yyyy = dateObj.getFullYear();
                return {
                    id: `recv_${tx.id}`,
                    date: `${dd}-${mm}-${yyyy}`,
                    timeVal: tx.scannedAtTimestamp,
                    name: tx.senderId || tx.escrowId,
                    amount: `+${tx.amount}`,
                    type: 'received'
                };
            });

            const combined = [...formattedSent, ...formattedReceived].sort((a, b) => b.timeVal - a.timeVal);
            setTransactions(combined);
        }
        fetchData();
    }, []);

    return (
        <div className="aeropay-screen">
            <p className="settings-header">Balance & History</p>
            <div className="back-icon" onClick={onClose}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </div>

            <div style={{ marginTop: '90px', display: 'flex', flexDirection: 'column', width: '100%', height: 'calc(100% - 90px)' }}>
                {/* Top Part: Balance */}
                <div style={{ textAlign: 'center', marginBottom: '20px', flexShrink: 0 }}>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '18px' }}>Balance</p>
                    <p style={{ margin: 7, color: '#fff', fontSize: '28px', fontFamily: '"Instrument Serif", serif', fontWeight: 'normal' }}>₹2000</p>
                </div>

                {/* Header (Fixed above the scroll area) */}
                <div style={{ padding: '0 20px' }}>
                    <div style={{ display: 'flex', width: '100%', borderBottom: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', padding: '15px 0', fontSize: '16px' }}>
                        <div style={{ width: '30%', textAlign: 'left' }}>Date</div>
                        <div style={{ width: '40%', textAlign: 'centre' }}>ID</div>
                        <div style={{ width: '30%', textAlign: 'right' }}>Amount</div>
                    </div>
                </div>

                {/* Rows Container - Only the rows scroll */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: '30px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        {transactions.map((tx) => (
                            <div key={tx.id} style={{ display: 'flex', width: '100%', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '15px 0', fontSize: '14px', alignItems: 'center' }}>
                                <div style={{ width: '30%', color: 'rgba(255,255,255,0.7)', textAlign: 'left' }}>{tx.date}</div>
                                <div style={{ width: '40%', color: 'rgba(255,255,255,0.7)', textAlign: 'centre', wordBreak: 'break-word' }}>{tx.name}</div>
                                <div style={{ width: '30%', textAlign: 'centre', color: tx.type === 'received' ? '#22c55e' : 'rgba(255,255,255,0.7)' }}>
                                    ₹{tx.amount}
                                </div>
                            </div>
                        ))}
                        {transactions.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>No transactions yet</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
