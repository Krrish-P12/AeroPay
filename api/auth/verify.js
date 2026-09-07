import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { upiId, pin } = req.body || {};

    if (!upiId || !pin) {
        return res.status(400).json({ success: false, error: 'UPI ID and PIN are required' });
    }

    // 1. If Neon DATABASE_URL is configured, verify against Postgres
    if (process.env.DATABASE_URL) {
        try {
            const sql = neon(process.env.DATABASE_URL);
            const users = await sql`SELECT id, pin_hash, balance FROM users WHERE id = ${upiId} LIMIT 1`;

            if (users.length === 0) {
                return res.status(404).json({ success: false, error: 'User not registered with bank' });
            }

            const user = users[0];
            if (user.pin_hash !== pin) {
                return res.status(401).json({ success: false, error: 'Invalid PIN. Verification failed.' });
            }

            return res.status(200).json({
                success: true,
                upiId: user.id,
                balance: Number(user.balance)
            });
        } catch (dbError) {
            console.error("Neon DB error in /api/auth/verify:", dbError);
            return res.status(500).json({ success: false, error: 'Database connection failed: ' + dbError.message });
        }
    }

    // 2. Development fallback if DATABASE_URL is not set yet
    if (pin === "1234") {
        return res.status(200).json({
            success: true,
            upiId,
            balance: 5000.00,
            mock: true
        });
    }

    return res.status(401).json({ success: false, error: 'Invalid PIN. (Demo default is 1234)' });
}
