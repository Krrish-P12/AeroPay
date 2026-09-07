import Dexie from "dexie";

const db = new Dexie("AeroPayUserDB");

db.version(3).stores({
    transactions: "++id, receiverId, amount, timestamp, nonce, status",
    profile: "id, upiId, linkedAt",
    confirmed_transactions: "++id, escrowId, nonce, senderId, receiverId, amount, status, timestamp"
});

export const savePayment = async (receiverId, amount, nonce) => {
    // Ensure amount is stored as a negative number for payments
    const negativeAmount = -Math.abs(Number(amount));

    await db.transactions.add({
        receiverId,
        amount: negativeAmount,
        timestamp: Date.now(),
        nonce,
        status: "PENDING"
    });
};

export const getHistory = async () => {
    return await db.transactions.toArray();
};

export const updateTransactionStatus = async (nonce, status) => {
    const records = await db.transactions.where("nonce").equals(Number(nonce)).toArray();
    for (const r of records) {
        await db.transactions.update(r.id, { status });
    }
};

export const saveConfirmedTransaction = async (txRecord) => {
    return await db.confirmed_transactions.put(txRecord);
};

export const getConfirmedTransactions = async () => {
    return await db.confirmed_transactions.toArray();
};

export const getNextNonce = async (receiverId) => {
    const records = await db.transactions
        .where("receiverId")
        .equals(receiverId)
        .toArray();

    if (records.length === 0) {
        return 1;
    }

    // Find the highest nonce for this receiverId
    const maxNonce = Math.max(...records.map(r => Number(r.nonce) || 0));
    return maxNonce + 1;
};

export const saveProfile = async (upiId) => {
    await db.profile.put({ id: 1, upiId, linkedAt: Date.now() });
};

export const getProfile = async () => {
    return await db.profile.get(1);
};

export const saveEscrowLock = async (escrowData) => {
    const existing = (await db.profile.get(1)) || { id: 1 };
    await db.profile.put({
        ...existing,
        ...escrowData,
        lockedAt: Date.now()
    });
};

export const getEscrowLock = async () => {
    return await db.profile.get(1);
};

export const getAvailableBalance = async () => {
    const profile = await getProfile();
    let lockedAmount = Number(profile?.lockedAmount);
    if (isNaN(lockedAmount) || !lockedAmount) {
        if (profile?.certData) {
            const parts = profile.certData.split('|');
            if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
                lockedAmount = Number(parts[1]);
                saveEscrowLock({ lockedAmount }).catch(() => {});
            } else {
                lockedAmount = 0;
            }
        } else {
            lockedAmount = 0;
        }
    }

    // Sent payments from AeroPayUserDB (Ignore VOID / Unclaimed expired transactions)
    const sent = await getHistory();
    const totalSent = sent
        .filter(tx => tx.status !== 'VOID')
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);

    // Received payments from AeroPayMerchantDB
    let totalReceived = 0;
    try {
        const merchantDb = new Dexie("AeroPayMerchantDB");
        merchantDb.version(1).stores({
            settlements: "++id, escrowId, nonce, syncStatus"
        });
        const received = await merchantDb.settlements.toArray();
        totalReceived = received.reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    } catch {
        totalReceived = 0;
    }

    return lockedAmount - totalSent + totalReceived;
};
