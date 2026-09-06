import Dexie from "dexie";

const db = new Dexie("AeroPayUserDB");

db.version(1).stores({
    transactions: "++id, receiverId, amount, timestamp, nonce"
});

export const savePayment = async (receiverId, amount, nonce) => {
    // Ensure amount is stored as a negative number for payments
    const negativeAmount = -Math.abs(Number(amount));

    await db.transactions.add({
        receiverId,
        amount: negativeAmount,
        timestamp: Date.now(),
        nonce
    });
};

export const getHistory = async () => {
    return await db.transactions.toArray();
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
