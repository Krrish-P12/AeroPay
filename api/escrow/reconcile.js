import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { escrowId, userId, localTransactions = [] } = req.body || {};

    if (!escrowId) {
        return res.status(400).json({ success: false, error: 'escrowId is required' });
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const MAX_PAYMENT_AGE = 60; // 60 seconds expiration window

    // 1. If Neon DATABASE_URL is configured, query PostgreSQL
    if (process.env.DATABASE_URL) {
        try {
            const sql = neon(process.env.DATABASE_URL);

            // Fetch escrow details
            const escrows = await sql`
                SELECT user_id, locked_amount, status 
                FROM escrow_locks 
                WHERE escrow_id = ${escrowId} 
                LIMIT 1
            `;

            if (escrows.length === 0) {
                return res.status(404).json({ success: false, error: 'Escrow lock not found' });
            }

            const escrow = escrows[0];
            const lockedAmount = Number(escrow.locked_amount);

            // Fetch all confirmed settled transactions for this escrow
            const confirmedRecords = await sql`
                SELECT id, escrow_id, sender_id, receiver_id, amount, nonce, status, settled_at 
                FROM confirmed_transactions 
                WHERE escrow_id = ${escrowId} AND status = 'SETTLED'
                ORDER BY nonce ASC
            `;

            const settledNonceMap = new Set(confirmedRecords.map(r => Number(r.nonce)));
            const totalSettledAmount = confirmedRecords.reduce((sum, r) => sum + Number(r.amount), 0);

            // Reconcile local transactions submitted by buyer
            const reconciledLocal = [];
            const voidedList = [];

            for (const tx of localTransactions) {
                const nonceNum = Number(tx.nonce);
                const isSettled = settledNonceMap.has(nonceNum);

                if (isSettled) {
                    reconciledLocal.push({
                        ...tx,
                        nonce: nonceNum,
                        status: 'SETTLED'
                    });
                } else {
                    // Check if the unscanned QR has expired
                    const txAge = currentTime - (Math.floor(Number(tx.timestamp) / 1000) || 0);
                    if (txAge > MAX_PAYMENT_AGE) {
                        // Unscanned QR expired without merchant claim -> VOID (Refunded to buyer)
                        const voidRecord = {
                            ...tx,
                            nonce: nonceNum,
                            status: 'VOID',
                            reason: 'Unscanned QR Expired - Refunded'
                        };
                        reconciledLocal.push(voidRecord);
                        voidedList.push(voidRecord);
                    } else {
                        // Still within the 60-second window, merchant might scan any moment
                        reconciledLocal.push({
                            ...tx,
                            nonce: nonceNum,
                            status: 'PENDING'
                        });
                    }
                }
            }

            const remainingBalance = Math.max(0, lockedAmount - totalSettledAmount);

            return res.status(200).json({
                success: true,
                escrowId,
                userId: escrow.user_id,
                lockedAmount,
                totalSettledAmount,
                remainingBalance,
                confirmedRecords,
                reconciledLocal,
                voidedCount: voidedList.length
            });
        } catch (dbErr) {
            console.error("Neon DB error in /api/escrow/reconcile:", dbErr);
            return res.status(500).json({ success: false, error: dbErr.message });
        }
    }

    // 2. Development fallback if DATABASE_URL is not set
    return res.status(200).json({
        success: true,
        escrowId,
        lockedAmount: 2000,
        totalSettledAmount: 0,
        remainingBalance: 2000,
        confirmedRecords: [],
        reconciledLocal: localTransactions.map(tx => ({ ...tx, status: 'SETTLED' })),
        voidedCount: 0,
        mock: true
    });
}
