import Dexie from "dexie";
import { getProfile, getHistory, updateTransactionStatus, saveConfirmedTransaction } from "../db";
import { getPendingSettlements, getAllSettlements } from "../qrParser";

/**
 * Sync Merchant's collected offline QR vouchers to the server.
 */
export async function syncMerchantSettlements() {
    if (!navigator.onLine) {
        console.warn("[AeroPay Sync] Device is offline. Cannot sync merchant settlements.");
        return { success: false, reason: "Offline" };
    }

    try {
        let vouchersToSync = await getPendingSettlements();
        
        // If no vouchers marked PENDING, check all settlements in case a previous attempt failed silently
        if (!vouchersToSync || vouchersToSync.length === 0) {
            const all = await getAllSettlements();
            if (all && all.length > 0) {
                vouchersToSync = all;
            } else {
                console.log("[AeroPay Sync] No vouchers found in merchant database.");
                return { success: true, count: 0, message: "No vouchers to sync" };
            }
        }

        const profile = await getProfile();
        const merchantId = profile?.upiId || "merchant@aeropay";

        console.log(`[AeroPay Sync] Submitting ${vouchersToSync.length} voucher(s) for merchant ${merchantId}...`, vouchersToSync);

        const response = await fetch('/api/settlements/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                merchantId,
                settlements: vouchersToSync
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server returned HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log("[AeroPay Sync] Server settlement response:", data);

        if (data.errors && data.errors.length > 0) {
            console.warn("[AeroPay Sync] Some settlements had warnings/errors:", data.errors);
        }

        // Mark successfully settled vouchers as SYNCED in AeroPayMerchantDB
        const merchantDb = new Dexie("AeroPayMerchantDB");
        merchantDb.version(1).stores({
            settlements: "++id, escrowId, nonce, syncStatus"
        });

        const settledKeys = new Set(
            (data.settledResults || []).map(r => `${r.escrowId}_${r.nonce}`)
        );

        for (const item of vouchersToSync) {
            if (settledKeys.has(`${item.escrowId}_${item.nonce}`)) {
                await merchantDb.settlements.update(item.id, { syncStatus: "SYNCED" });
            }
        }

        return {
            success: true,
            count: data.settledCount || 0,
            settledResults: data.settledResults,
            errors: data.errors
        };
    } catch (error) {
        console.error("[AeroPay Sync] Merchant sync failed:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Reconcile Buyer's local QR attempts against authoritative claims on the server.
 * Voids abandoned/unscanned QRs and refunds money to available balance.
 */
export async function reconcileBuyerEscrow() {
    if (!navigator.onLine) {
        return { success: false, reason: "Offline" };
    }

    try {
        const profile = await getProfile();
        if (!profile?.escrowId) {
            return { success: true, message: "No active escrow to reconcile" };
        }

        const sentTransactions = await getHistory();

        console.log(`[AeroPay Reconcile] Reconciling buyer escrow ${profile.escrowId}...`, sentTransactions);

        const response = await fetch('/api/escrow/reconcile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                escrowId: profile.escrowId,
                userId: profile.upiId,
                localTransactions: sentTransactions
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server returned HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log("[AeroPay Reconcile] Buyer reconcile response:", data);

        // Update local statuses (SETTLED vs VOID)
        if (data.reconciledLocal && Array.isArray(data.reconciledLocal)) {
            for (const tx of data.reconciledLocal) {
                if (tx.nonce) {
                    await updateTransactionStatus(tx.nonce, tx.status);
                }
            }
        }

        // Cache confirmed server records
        if (data.confirmedRecords && Array.isArray(data.confirmedRecords)) {
            for (const record of data.confirmedRecords) {
                await saveConfirmedTransaction({
                    escrowId: record.escrow_id,
                    nonce: Number(record.nonce),
                    senderId: record.sender_id,
                    receiverId: record.receiver_id,
                    amount: Number(record.amount),
                    status: record.status,
                    timestamp: record.settled_at ? new Date(record.settled_at).getTime() : Date.now()
                });
            }
        }

        return {
            success: true,
            voidedCount: data.voidedCount || 0,
            remainingBalance: data.remainingBalance,
            totalSettled: data.totalSettledAmount
        };
    } catch (error) {
        console.error("[AeroPay Reconcile] Buyer reconcile failed:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Run full dual-side reconciliation: merchant upload + buyer settlement check.
 */
export async function reconcileAll() {
    if (!navigator.onLine) {
        console.warn("[AeroPay] Cannot reconcile while offline.");
        return { offline: true };
    }

    console.log("[AeroPay] Starting full reconciliation (Merchant sync + Buyer reconcile)...");

    const [merchantRes, buyerRes] = await Promise.allSettled([
        syncMerchantSettlements(),
        reconcileBuyerEscrow()
    ]);

    const result = {
        merchant: merchantRes.status === "fulfilled" ? merchantRes.value : { success: false, error: merchantRes.reason },
        buyer: buyerRes.status === "fulfilled" ? buyerRes.value : { success: false, error: buyerRes.reason }
    };

    console.log("[AeroPay] Full reconciliation result:", result);
    return result;
}
