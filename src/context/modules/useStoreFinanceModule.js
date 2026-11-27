import { useState, useCallback } from 'react';
import { db } from 'api/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

const STORAGE_KEYS = {
  customers: 'rehmat_store_customers_v1',
  payments: 'rehmat_store_payments_v1'
};

const DELETED_KEYS = {
  customers: 'rehmat_deleted_store_customer_ids',
  payments: 'rehmat_deleted_store_payment_ids'
};

const PENDING_KEYS = {
  customers: 'rehmat_pending_store_customer_ids',
  payments: 'rehmat_pending_store_payment_ids'
};

const safeParseJSON = (key, fallback = []) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (err) {
    console.error(`SafeJSON Error parsing ${key}:`, err);
    return fallback;
  }
};

const persistJSON = (key, value) => {
  try {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          console.warn(`LocalStorage write warning (${key}):`, e);
        }
      });
    } else {
      setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          console.warn(`LocalStorage write warning (${key}):`, e);
        }
      }, 0);
    }
  } catch (err) {
    console.warn(`LocalStorage write warning (${key}):`, err);
  }
};

const addTrackedId = (key, id) => {
  const existing = safeParseJSON(key, []).map(String);
  persistJSON(key, Array.from(new Set([...existing, String(id)])));
};

const removeTrackedId = (key, id) => {
  const existing = safeParseJSON(key, []).map(String);
  if (existing.length === 0) return;
  persistJSON(
    key,
    existing.filter((item) => item !== String(id))
  );
};

const syncWithTimeout = (promise, ms = 1200) => Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]);

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Modular data hook managing Factory Store Party Accounts (store_customers)
 * and Factory Store Lena-Dena Vouchers (store_payments) with instant local persistence
 * and resilient Firestore synchronization.
 */
export function useStoreFinanceModule({ usageLogs = [], updateLog, vendorPayments = [], deleteVendorPayment }) {
  const [storeCustomers, setStoreCustomers] = useState(() => safeParseJSON(STORAGE_KEYS.customers, []));
  const [storePayments, setStorePayments] = useState(() => safeParseJSON(STORAGE_KEYS.payments, []));

  const syncStoreFinanceFromCloud = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const deletedCustSet = new Set(safeParseJSON(DELETED_KEYS.customers, []).map(String));
    const deletedPaySet = new Set(safeParseJSON(DELETED_KEYS.payments, []).map(String));

    // Flush any locally queued offline customers or vouchers first
    const pendingCustIds = safeParseJSON(PENDING_KEYS.customers, []).map(String);
    if (pendingCustIds.length > 0) {
      const localCusts = safeParseJSON(STORAGE_KEYS.customers, []);
      await Promise.allSettled(
        pendingCustIds.map(async (id) => {
          const c = localCusts.find((item) => String(item.id) === id);
          if (!c || deletedCustSet.has(id)) {
            removeTrackedId(PENDING_KEYS.customers, id);
            return;
          }
          await setDoc(
            doc(db, 'store_customers', id),
            {
              ...c,
              opening_balance: parseFloat(c.openingBalance) || 0,
              created_at: c.createdAt || ''
            },
            { merge: true }
          );
          removeTrackedId(PENDING_KEYS.customers, id);
        })
      );
    }

    const pendingPayIds = safeParseJSON(PENDING_KEYS.payments, []).map(String);
    if (pendingPayIds.length > 0) {
      const localPays = safeParseJSON(STORAGE_KEYS.payments, []);
      await Promise.allSettled(
        pendingPayIds.map(async (id) => {
          const p = localPays.find((item) => String(item.id) === id);
          if (!p || deletedPaySet.has(id)) {
            removeTrackedId(PENDING_KEYS.payments, id);
            return;
          }
          await setDoc(
            doc(db, 'store_payments', id),
            {
              ...p,
              voucher_no: p.voucherNo,
              entry_type: p.entryType,
              reference_type: p.referenceType,
              invoice_id: p.invoiceId,
              reference_label: p.referenceLabel,
              customer_name: p.customerName,
              amount_paid: p.amountPaid,
              payment_method: p.paymentMethod,
              reference_no: p.referenceNo,
              payment_date: p.time,
              created_at: p.createdAt
            },
            { merge: true }
          );
          removeTrackedId(PENDING_KEYS.payments, id);
        })
      );
    }

    const [custSnap, paySnap] = await Promise.allSettled([
      getDocs(collection(db, 'store_customers')),
      getDocs(collection(db, 'store_payments'))
    ]);

    const toDocs = (res) => (res.status === 'fulfilled' && res.value?.docs ? res.value.docs.map((d) => ({ id: d.id, ...d.data() })) : []);

    if (custSnap.status === 'fulfilled') {
      const cleanCusts = toDocs(custSnap)
        .filter((c) => !deletedCustSet.has(String(c.id)))
        .map((c) => ({
          id: c.id,
          name: (c.name || '').trim(),
          phone: (c.phone || '').trim(),
          city: (c.city || c.address || '').trim(),
          address: (c.address || c.city || '').trim(),
          openingBalance: parseFloat(c.openingBalance ?? c.opening_balance) || 0,
          notes: (c.notes || '').trim(),
          createdAt: c.createdAt || c.created_at || ''
        }));

      const remoteIds = new Set(cleanCusts.map((c) => String(c.id)));
      const pendingIds = safeParseJSON(PENDING_KEYS.customers, []).map(String);
      const stillPending = pendingIds.filter((id) => !remoteIds.has(id) && !deletedCustSet.has(id));
      persistJSON(PENDING_KEYS.customers, stillPending);

      const localCusts = safeParseJSON(STORAGE_KEYS.customers, []);
      const pendingSet = new Set(stillPending);
      const unsynced = localCusts.filter((c) => pendingSet.has(String(c.id)) && !remoteIds.has(String(c.id)));
      const merged = [...unsynced, ...cleanCusts].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      if (merged.length > 0 || !custSnap.value.metadata?.fromCache) {
        setStoreCustomers(merged);
        persistJSON(STORAGE_KEYS.customers, merged);
      }
    }

    if (paySnap.status === 'fulfilled') {
      const cleanPays = toDocs(paySnap)
        .filter((p) => !deletedPaySet.has(String(p.id)))
        .map((p) => ({
          id: p.id,
          voucherNo: p.voucherNo || p.voucher_no || `STR-${String(p.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase()}`,
          invoiceId: p.invoiceId || p.invoice_id || '',
          referenceType: p.referenceType || p.reference_type || (p.invoiceId || p.invoice_id ? 'Bill' : 'Account'),
          referenceLabel: p.referenceLabel || p.reference_label || '',
          entryType: p.entryType || p.entry_type || 'Receipt',
          customerName: (p.customerName || p.customer_name || 'Walk-in Party').trim(),
          amountPaid: parseFloat(p.amountPaid ?? p.amount_paid) || 0,
          paymentMethod: p.paymentMethod || p.payment_method || 'Cash',
          referenceNo: p.referenceNo || p.reference_no || '',
          notes: p.notes || '',
          time: p.time || p.payment_date || (p.createdAt || p.created_at ? new Date(p.createdAt || p.created_at).toLocaleString() : ''),
          createdAt: p.createdAt || p.created_at || ''
        }));

      const remoteIds = new Set(cleanPays.map((p) => String(p.id)));
      const pendingIds = safeParseJSON(PENDING_KEYS.payments, []).map(String);
      const stillPending = pendingIds.filter((id) => !remoteIds.has(id) && !deletedPaySet.has(id));
      persistJSON(PENDING_KEYS.payments, stillPending);

      const localPays = safeParseJSON(STORAGE_KEYS.payments, []);
      const pendingSet = new Set(stillPending);
      const unsynced = localPays.filter((p) => pendingSet.has(String(p.id)) && !remoteIds.has(String(p.id)));
      const merged = [...unsynced, ...cleanPays].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      if (merged.length > 0 || !paySnap.value.metadata?.fromCache) {
        setStorePayments(merged);
        persistJSON(STORAGE_KEYS.payments, merged);
      }
    }
  }, []);

  const addStoreCustomer = async (customerData) => {
    const custId = generateUUID();
    const nowISO = new Date().toISOString();
    const newCustomer = {
      id: custId,
      name: (customerData.name || '').trim(),
      phone: (customerData.phone || '').trim(),
      city: (customerData.city || '').trim(),
      address: (customerData.address || customerData.city || '').trim(),
      openingBalance: parseFloat(customerData.openingBalance) || 0,
      notes: (customerData.notes || '').trim(),
      createdAt: nowISO
    };

    removeTrackedId(DELETED_KEYS.customers, custId);
    addTrackedId(PENDING_KEYS.customers, custId);

    setStoreCustomers((prev) => {
      const updated = [newCustomer, ...prev].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      persistJSON(STORAGE_KEYS.customers, updated);
      return updated;
    });

    await syncWithTimeout(
      setDoc(
        doc(db, 'store_customers', String(custId)),
        {
          id: custId,
          name: newCustomer.name,
          phone: newCustomer.phone,
          city: newCustomer.city,
          address: newCustomer.address,
          openingBalance: newCustomer.openingBalance,
          opening_balance: newCustomer.openingBalance,
          notes: newCustomer.notes,
          createdAt: nowISO,
          created_at: nowISO
        },
        { merge: true }
      )
        .then(() => removeTrackedId(PENDING_KEYS.customers, custId))
        .catch((e) => console.warn('Firebase addStoreCustomer warning:', e))
    );

    return newCustomer;
  };

  const updateStoreCustomer = async (id, updatedFields) => {
    let saved = null;
    setStoreCustomers((prev) => {
      const updated = prev.map((c) => {
        if (String(c.id) === String(id)) {
          saved = {
            ...c,
            ...updatedFields,
            openingBalance: updatedFields.openingBalance !== undefined ? parseFloat(updatedFields.openingBalance) || 0 : c.openingBalance
          };
          return saved;
        }
        return c;
      });
      persistJSON(STORAGE_KEYS.customers, updated);
      return updated;
    });

    await syncWithTimeout(
      setDoc(
        doc(db, 'store_customers', String(id)),
        {
          ...updatedFields,
          ...(updatedFields.openingBalance !== undefined ? { opening_balance: parseFloat(updatedFields.openingBalance) || 0 } : {})
        },
        { merge: true }
      ).catch((e) => console.warn('Firebase updateStoreCustomer warning:', e))
    );
    return saved;
  };

  const deleteStoreCustomer = async (id) => {
    const strId = String(id);
    addTrackedId(DELETED_KEYS.customers, strId);
    removeTrackedId(PENDING_KEYS.customers, strId);

    setStoreCustomers((prev) => {
      const updated = prev.filter((c) => String(c.id) !== strId);
      persistJSON(STORAGE_KEYS.customers, updated);
      return updated;
    });

    try {
      await syncWithTimeout(deleteDoc(doc(db, 'store_customers', strId)));
    } catch (e) {
      console.warn('Firebase deleteStoreCustomer warning:', e);
    }
  };

  const addStorePayment = async (paymentData) => {
    const paymentId = generateUUID();
    const voucherNo = paymentData.voucherNo || `STR-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const formattedTime = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    const entryType = paymentData.entryType || 'Receipt';
    const amountNum = Math.max(0, parseFloat(paymentData.amountPaid) || 0);

    const newPayment = {
      id: paymentId,
      voucherNo,
      entryType,
      referenceType: paymentData.referenceType || (paymentData.invoiceId ? 'Bill' : 'Account'),
      invoiceId: paymentData.invoiceId || '',
      referenceLabel: paymentData.referenceLabel || '',
      customerName: (paymentData.customerName || 'Walk-in Party').trim(),
      amountPaid: amountNum,
      paymentMethod: paymentData.paymentMethod || 'Cash',
      referenceNo: paymentData.referenceNo || '',
      notes: paymentData.notes || '',
      time: formattedTime,
      createdAt: now.toISOString(),
      source: 'store_payment'
    };

    removeTrackedId(DELETED_KEYS.payments, paymentId);
    addTrackedId(PENDING_KEYS.payments, paymentId);

    setStorePayments((prev) => {
      const updated = [newPayment, ...prev];
      persistJSON(STORAGE_KEYS.payments, updated);
      return updated;
    });

    const syncTasks = [];

    if (paymentData.invoiceId && typeof updateLog === 'function') {
      const targetLog = (usageLogs || []).find((l) => String(l.id) === String(paymentData.invoiceId));
      if (targetLog) {
        const isStockInBill = String(targetLog.type || '').toUpperCase().includes('IN');
        const deltaPaid = isStockInBill ? (entryType === 'Receipt' ? -amountNum : amountNum) : entryType === 'Payout' ? -amountNum : amountNum;
        const currentPaid = parseFloat(targetLog.amountPaid) || 0;
        const updatedPaid = Math.max(0, currentPaid + deltaPaid);
        const billTotal =
          targetLog.lineTotal !== undefined && Number(targetLog.lineTotal) > 0
            ? parseFloat(targetLog.lineTotal)
            : (parseFloat(targetLog.qtyUsed) || 1) * (parseFloat(targetLog.unitPrice) || 0);
        const updatedBal = Math.max(0, billTotal - updatedPaid);
        syncTasks.push(
          updateLog(targetLog.id, {
            amountPaid: updatedPaid,
            remainingBalance: updatedBal,
            paymentMethod: newPayment.paymentMethod
          })
        );
      }
    }

    syncTasks.push(
      setDoc(
        doc(db, 'store_payments', String(paymentId)),
        {
          ...newPayment,
          voucher_no: voucherNo,
          entry_type: entryType,
          reference_type: newPayment.referenceType,
          invoice_id: newPayment.invoiceId,
          reference_label: newPayment.referenceLabel,
          customer_name: newPayment.customerName,
          amount_paid: newPayment.amountPaid,
          payment_method: newPayment.paymentMethod,
          reference_no: newPayment.referenceNo,
          payment_date: newPayment.time,
          created_at: newPayment.createdAt
        },
        { merge: true }
      )
        .then(() => removeTrackedId(PENDING_KEYS.payments, paymentId))
        .catch((e) => console.warn('Firebase addStorePayment warning:', e))
    );

    await Promise.race([Promise.allSettled(syncTasks), new Promise((resolve) => setTimeout(resolve, 1200))]);
    return newPayment;
  };

  const deleteStorePayment = async (paymentOrId) => {
    const strId = typeof paymentOrId === 'object' && paymentOrId !== null ? String(paymentOrId.id) : String(paymentOrId);
    const isVendorPay =
      (typeof paymentOrId === 'object' && paymentOrId?.source === 'vendor_payment') ||
      (vendorPayments || []).some((vp) => String(vp.id) === strId);

    if (isVendorPay && typeof deleteVendorPayment === 'function') {
      await deleteVendorPayment(strId);
      return;
    }

    const target = (storePayments || []).find((p) => String(p.id) === strId);
    addTrackedId(DELETED_KEYS.payments, strId);
    removeTrackedId(PENDING_KEYS.payments, strId);

    setStorePayments((prev) => {
      const updated = prev.filter((p) => String(p.id) !== strId);
      persistJSON(STORAGE_KEYS.payments, updated);
      return updated;
    });

    if (target && target.invoiceId && typeof updateLog === 'function') {
      const targetLog = (usageLogs || []).find((l) => String(l.id) === String(target.invoiceId));
      if (targetLog) {
        const amt = Math.max(0, parseFloat(target.amountPaid) || 0);
        const isStockInBill = String(targetLog.type || '').toUpperCase().includes('IN');
        const reverseDelta = isStockInBill
          ? target.entryType === 'Receipt'
            ? amt
            : -amt
          : target.entryType === 'Payout'
            ? amt
            : -amt;
        const updatedPaid = Math.max(0, (parseFloat(targetLog.amountPaid) || 0) + reverseDelta);
        const billTotal =
          targetLog.lineTotal !== undefined && Number(targetLog.lineTotal) > 0
            ? parseFloat(targetLog.lineTotal)
            : (parseFloat(targetLog.qtyUsed) || 1) * (parseFloat(targetLog.unitPrice) || 0);
        const updatedBal = Math.max(0, billTotal - updatedPaid);
        await updateLog(targetLog.id, {
          amountPaid: updatedPaid,
          remainingBalance: updatedBal
        });
      }
    }

    try {
      await syncWithTimeout(deleteDoc(doc(db, 'store_payments', strId)));
    } catch (e) {
      console.warn('Firebase deleteStorePayment warning:', e);
    }
  };

  return {
    storeCustomers,
    setStoreCustomers,
    storePayments,
    setStorePayments,
    syncStoreFinanceFromCloud,
    addStoreCustomer,
    updateStoreCustomer,
    deleteStoreCustomer,
    addStorePayment,
    deleteStorePayment
  };
}
