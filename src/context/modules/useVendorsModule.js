import { useState, useCallback } from 'react';
import { db } from 'api/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

const STORAGE_KEYS = {
  vendors: 'rehmat_store_vendors_v2',
  vendorPayments: 'rehmat_store_vendor_payments_v2',
  deletedVendors: 'rehmat_deleted_vendor_ids',
  pendingVendors: 'rehmat_pending_vendor_ids',
  deletedVendorPayments: 'rehmat_deleted_vendor_payment_ids',
  pendingVendorPayments: 'rehmat_pending_vendor_payment_ids'
};

const safeParse = (key, fallback = []) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const persistJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`LocalStorage write warning (${key}):`, e);
  }
};

const trackId = (key, id) => {
  const existing = safeParse(key, []).map(String);
  persistJSON(key, Array.from(new Set([...existing, String(id)])));
};

const untrackId = (key, id) => {
  const existing = safeParse(key, []).map(String);
  if (existing.length === 0) return;
  persistJSON(
    key,
    existing.filter((x) => x !== String(id))
  );
};

const syncWithTimeout = (promise, ms = 1500) => Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]);

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

const toFirestoreVendorPayload = (v) => ({
  id: v.id,
  name: v.name || 'Vendor',
  contact_person: v.contactPerson || v.name || 'Vendor',
  company_name: v.companyName || v.contactPerson || v.name || 'Vendor',
  phone: v.phone || 'N/A',
  email: v.email || 'N/A',
  address: v.address || 'Local',
  city_address: v.address || 'Local',
  supplied_category: v.suppliedCategory || 'General',
  opening_balance: parseFloat(v.openingBalance) || 0,
  current_balance: parseFloat(v.currentBalance) || 0,
  status: 1,
  rating: 5.0
});

const toFirestoreVendorPaymentPayload = (p) => ({
  id: p.id,
  voucher_no: p.voucherNo,
  vendor_name: p.vendorName,
  payment_date: p.time,
  created_at: p.createdAt,
  amount_paid: p.amountPaid,
  payment_method: p.paymentMethod,
  reference_no: p.referenceNo,
  items: p.items,
  notes: p.notes
});

export function useVendorsModule() {
  const [vendors, setVendors] = useState(() => safeParse(STORAGE_KEYS.vendors, []));
  const [vendorPayments, setVendorPayments] = useState(() => safeParse(STORAGE_KEYS.vendorPayments, []));

  const addVendor = async (vendorData) => {
    const vendorId = generateUUID();
    const newVendor = {
      ...vendorData,
      id: vendorId
    };

    untrackId(STORAGE_KEYS.deletedVendors, vendorId);
    trackId(STORAGE_KEYS.pendingVendors, vendorId);

    setVendors((prev) => {
      const updated = [newVendor, ...prev];
      persistJSON(STORAGE_KEYS.vendors, updated);
      return updated;
    });

    await syncWithTimeout(
      setDoc(doc(db, 'vendors', String(vendorId)), toFirestoreVendorPayload(newVendor), { merge: true })
        .then(() => untrackId(STORAGE_KEYS.pendingVendors, vendorId))
        .catch((e) => console.error('Firebase addVendor error:', e))
    );
    return newVendor;
  };

  const updateVendor = async (vendorId, updatedData) => {
    const strId = String(vendorId);
    let updatedVendorObj = null;
    trackId(STORAGE_KEYS.pendingVendors, strId);

    setVendors((prev) => {
      const updated = prev.map((v) => {
        if (String(v.id) === strId) {
          updatedVendorObj = { ...v, ...updatedData };
          return updatedVendorObj;
        }
        return v;
      });
      persistJSON(STORAGE_KEYS.vendors, updated);
      return updated;
    });

    await syncWithTimeout(
      setDoc(
        doc(db, 'vendors', strId),
        updatedVendorObj
          ? toFirestoreVendorPayload(updatedVendorObj)
          : {
              name: updatedData.name,
              contact_person: updatedData.contactPerson || updatedData.name,
              company_name: updatedData.companyName || updatedData.contactPerson || updatedData.name,
              phone: updatedData.phone,
              email: updatedData.email,
              address: updatedData.address,
              city_address: updatedData.address,
              supplied_category: updatedData.suppliedCategory
            },
        { merge: true }
      )
        .then(() => untrackId(STORAGE_KEYS.pendingVendors, strId))
        .catch((e) => console.error('Firebase updateVendor error:', e))
    );
  };

  const deleteVendor = async (vendorId) => {
    const stringId = String(vendorId);
    trackId(STORAGE_KEYS.deletedVendors, stringId);
    untrackId(STORAGE_KEYS.pendingVendors, stringId);

    setVendors((prev) => {
      const updated = prev.filter((v) => String(v.id) !== stringId);
      persistJSON(STORAGE_KEYS.vendors, updated);
      return updated;
    });

    await syncWithTimeout(
      deleteDoc(doc(db, 'vendors', stringId)).catch((e) => console.error('Firebase deleteVendor error:', e))
    );
  };

  const deleteMultipleVendors = async (vendorIds) => {
    const stringIds = vendorIds.map(String);
    const idsSet = new Set(stringIds);
    stringIds.forEach((id) => {
      trackId(STORAGE_KEYS.deletedVendors, id);
      untrackId(STORAGE_KEYS.pendingVendors, id);
    });

    setVendors((prev) => {
      const updated = prev.filter((v) => !idsSet.has(String(v.id)));
      persistJSON(STORAGE_KEYS.vendors, updated);
      return updated;
    });

    await syncWithTimeout(
      Promise.allSettled(stringIds.map((id) => deleteDoc(doc(db, 'vendors', id)))).catch((e) =>
        console.error('Firebase deleteMultipleVendors error:', e)
      )
    );
  };

  const addVendorPayment = async (paymentData) => {
    const paymentId = generateUUID();
    const nowISO = new Date().toISOString();
    const newPayment = {
      ...paymentData,
      id: paymentId,
      voucherNo: paymentData.voucherNo || `VP-${Math.floor(10000 + Math.random() * 90000)}`,
      amountPaid: parseFloat(paymentData.amountPaid) || 0,
      items: Array.isArray(paymentData.items) ? paymentData.items : [],
      time: paymentData.paymentDate || new Date().toLocaleString(),
      createdAt: paymentData.createdAt || nowISO
    };

    untrackId(STORAGE_KEYS.deletedVendorPayments, paymentId);
    trackId(STORAGE_KEYS.pendingVendorPayments, paymentId);

    setVendorPayments((prev) => {
      const updated = [newPayment, ...prev];
      persistJSON(STORAGE_KEYS.vendorPayments, updated);
      return updated;
    });

    await syncWithTimeout(
      setDoc(doc(db, 'vendor_payments', String(paymentId)), toFirestoreVendorPaymentPayload(newPayment), { merge: true })
        .then(() => untrackId(STORAGE_KEYS.pendingVendorPayments, paymentId))
        .catch((e) => console.error('Firebase addVendorPayment Exception:', e))
    );
    return newPayment;
  };

  const deleteVendorPayment = async (paymentId) => {
    const stringId = String(paymentId);
    trackId(STORAGE_KEYS.deletedVendorPayments, stringId);
    untrackId(STORAGE_KEYS.pendingVendorPayments, stringId);

    setVendorPayments((prev) => {
      const updated = prev.filter((p) => String(p.id) !== stringId);
      persistJSON(STORAGE_KEYS.vendorPayments, updated);
      return updated;
    });

    await syncWithTimeout(
      deleteDoc(doc(db, 'vendor_payments', stringId)).catch((e) => console.error('Firebase deleteVendorPayment error:', e))
    );
  };

  const syncVendorsFromCloud = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const deletedVendorSet = new Set(safeParse(STORAGE_KEYS.deletedVendors, []).map(String));
    const deletedPaySet = new Set(safeParse(STORAGE_KEYS.deletedVendorPayments, []).map(String));

    // Flush pending offline vendors
    const pendingVendorIds = safeParse(STORAGE_KEYS.pendingVendors, []).map(String);
    if (pendingVendorIds.length > 0) {
      const localVendors = safeParse(STORAGE_KEYS.vendors, []);
      await Promise.allSettled(
        pendingVendorIds.map(async (id) => {
          const v = localVendors.find((item) => String(item.id) === id);
          if (!v || deletedVendorSet.has(id)) {
            untrackId(STORAGE_KEYS.pendingVendors, id);
            return;
          }
          await setDoc(doc(db, 'vendors', id), toFirestoreVendorPayload(v), { merge: true });
          untrackId(STORAGE_KEYS.pendingVendors, id);
        })
      );
    }

    // Flush pending offline vendor payments
    const pendingPayIds = safeParse(STORAGE_KEYS.pendingVendorPayments, []).map(String);
    if (pendingPayIds.length > 0) {
      const localPays = safeParse(STORAGE_KEYS.vendorPayments, []);
      await Promise.allSettled(
        pendingPayIds.map(async (id) => {
          const p = localPays.find((item) => String(item.id) === id);
          if (!p || deletedPaySet.has(id)) {
            untrackId(STORAGE_KEYS.pendingVendorPayments, id);
            return;
          }
          await setDoc(doc(db, 'vendor_payments', id), toFirestoreVendorPaymentPayload(p), { merge: true });
          untrackId(STORAGE_KEYS.pendingVendorPayments, id);
        })
      );
    }

    const [vendorsSnap, paySnap] = await Promise.allSettled([
      getDocs(collection(db, 'vendors')),
      getDocs(collection(db, 'vendor_payments'))
    ]);

    if (vendorsSnap.status === 'fulfilled' && vendorsSnap.value?.docs) {
      const remoteVendors = vendorsSnap.value.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((v) => !deletedVendorSet.has(String(v.id)))
        .map((v) => ({
          id: v.id,
          name: (v.name || '').trim(),
          contactPerson: v.contact_person || v.company_name || v.contactPerson || v.name,
          companyName: v.company_name || v.companyName || v.name,
          phone: v.phone || 'N/A',
          email: v.email || 'N/A',
          address: v.city_address || v.address || 'Local',
          suppliedCategory: v.supplied_category || v.suppliedCategory || 'General',
          openingBalance: parseFloat(v.opening_balance || v.openingBalance) || 0,
          currentBalance: parseFloat(v.current_balance || v.currentBalance) || 0
        }));

      const remoteIds = new Set(remoteVendors.map((v) => String(v.id)));
      const stillPending = safeParse(STORAGE_KEYS.pendingVendors, []).map(String).filter((id) => !remoteIds.has(id) && !deletedVendorSet.has(id));
      persistJSON(STORAGE_KEYS.pendingVendors, stillPending);
      const pendingSet = new Set(stillPending);
      const localVendors = safeParse(STORAGE_KEYS.vendors, []);
      const unsynced = localVendors.filter((v) => pendingSet.has(String(v.id)) && !remoteIds.has(String(v.id)));
      const merged = [...unsynced, ...remoteVendors].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      if (merged.length > 0 || !vendorsSnap.value.metadata?.fromCache) {
        setVendors(merged);
        persistJSON(STORAGE_KEYS.vendors, merged);
      }
    }

    if (paySnap.status === 'fulfilled' && paySnap.value?.docs) {
      const remotePays = paySnap.value.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => !deletedPaySet.has(String(p.id)))
        .map((p) => ({
          id: p.id,
          voucherNo: p.voucher_no || p.voucherNo || `VP-${String(p.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase()}`,
          vendorName: (p.vendor_name || p.vendorName || '').trim(),
          amountPaid: parseFloat(p.amount_paid !== undefined ? p.amount_paid : p.amountPaid) || 0,
          paymentMethod: p.payment_method || p.paymentMethod || 'Cash',
          referenceNo: p.reference_no || p.referenceNo || '',
          items: Array.isArray(p.items) ? p.items : [],
          notes: p.notes || '',
          time: p.payment_date || p.time || (p.created_at ? new Date(p.created_at).toLocaleString() : new Date().toLocaleString()),
          createdAt: p.created_at || p.createdAt
        }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      const remoteIds = new Set(remotePays.map((p) => String(p.id)));
      const stillPending = safeParse(STORAGE_KEYS.pendingVendorPayments, []).map(String).filter((id) => !remoteIds.has(id) && !deletedPaySet.has(id));
      persistJSON(STORAGE_KEYS.pendingVendorPayments, stillPending);
      const pendingSet = new Set(stillPending);
      const localPays = safeParse(STORAGE_KEYS.vendorPayments, []);
      const unsynced = localPays.filter((p) => pendingSet.has(String(p.id)) && !remoteIds.has(String(p.id)));
      const mergedPays = [...unsynced, ...remotePays].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      if (mergedPays.length > 0 || !paySnap.value.metadata?.fromCache) {
        setVendorPayments(mergedPays);
        persistJSON(STORAGE_KEYS.vendorPayments, mergedPays);
      }
    }
  }, []);

  return {
    vendors,
    setVendors,
    vendorPayments,
    setVendorPayments,
    addVendor,
    updateVendor,
    deleteVendor,
    deleteMultipleVendors,
    addVendorPayment,
    deleteVendorPayment,
    syncVendorsFromCloud
  };
}
