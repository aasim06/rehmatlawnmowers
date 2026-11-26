import { useState } from 'react';
import { db } from 'api/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

const safeParse = (key, fallback = []) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

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

export function useVendorsModule() {
  const [vendors, setVendors] = useState(() => safeParse('rehmat_store_vendors_v2', []));
  const [vendorPayments, setVendorPayments] = useState(() => safeParse('rehmat_store_vendor_payments_v2', []));

  const addVendor = async (vendorData) => {
    const vendorId = generateUUID();
    const newVendor = {
      ...vendorData,
      id: vendorId
    };
    setVendors((prev) => {
      const updated = [newVendor, ...prev];
      localStorage.setItem('rehmat_store_vendors_v2', JSON.stringify(updated));
      return updated;
    });

    try {
      await setDoc(
        doc(db, 'vendors', String(vendorId)),
        {
          id: vendorId,
          name: vendorData.name || 'Vendor',
          contact_person: vendorData.contactPerson || vendorData.name,
          phone: vendorData.phone || 'N/A',
          email: vendorData.email || 'N/A',
          address: vendorData.address || 'Local',
          supplied_category: vendorData.suppliedCategory || 'General',
          status: 1,
          rating: 5.0
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Firebase addVendor error:', e);
    }
    return newVendor;
  };

  const updateVendor = async (vendorId, updatedData) => {
    setVendors((prev) => {
      const updated = prev.map((v) => (v.id === vendorId ? { ...v, ...updatedData } : v));
      localStorage.setItem('rehmat_store_vendors_v2', JSON.stringify(updated));
      return updated;
    });

    try {
      await setDoc(
        doc(db, 'vendors', String(vendorId)),
        {
          name: updatedData.name,
          contact_person: updatedData.contactPerson || updatedData.name,
          phone: updatedData.phone,
          email: updatedData.email,
          address: updatedData.address,
          supplied_category: updatedData.suppliedCategory
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Firebase updateVendor error:', e);
    }
  };

  const deleteVendor = async (vendorId) => {
    const stringId = String(vendorId);
    const deletedIds = Array.from(new Set([...safeParse('rehmat_deleted_vendor_ids', []), stringId]));
    localStorage.setItem('rehmat_deleted_vendor_ids', JSON.stringify(deletedIds));

    setVendors((prev) => {
      const updated = prev.filter((v) => String(v.id) !== stringId);
      localStorage.setItem('rehmat_store_vendors_v2', JSON.stringify(updated));
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'vendors', String(vendorId)));
    } catch (e) {
      console.error('Firebase deleteVendor error:', e);
    }
  };

  const deleteMultipleVendors = async (vendorIds) => {
    const stringIds = vendorIds.map(String);
    const idsSet = new Set(stringIds);
    const deletedIds = Array.from(new Set([...safeParse('rehmat_deleted_vendor_ids', []), ...stringIds]));
    localStorage.setItem('rehmat_deleted_vendor_ids', JSON.stringify(deletedIds));

    setVendors((prev) => {
      const updated = prev.filter((v) => !idsSet.has(String(v.id)));
      localStorage.setItem('rehmat_store_vendors_v2', JSON.stringify(updated));
      return updated;
    });

    try {
      await Promise.allSettled(vendorIds.map((id) => deleteDoc(doc(db, 'vendors', String(id)))));
    } catch (e) {
      console.error('Firebase deleteMultipleVendors error:', e);
    }
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

    setVendorPayments((prev) => {
      const updated = [newPayment, ...prev];
      localStorage.setItem('rehmat_store_vendor_payments_v2', JSON.stringify(updated));
      return updated;
    });

    try {
      await setDoc(
        doc(db, 'vendor_payments', String(paymentId)),
        {
          id: paymentId,
          voucher_no: newPayment.voucherNo,
          vendor_name: newPayment.vendorName,
          payment_date: newPayment.time,
          created_at: newPayment.createdAt,
          amount_paid: newPayment.amountPaid,
          payment_method: newPayment.paymentMethod,
          reference_no: newPayment.referenceNo,
          items: newPayment.items,
          notes: newPayment.notes
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Firebase addVendorPayment Exception:', e);
    }
    return newPayment;
  };

  const deleteVendorPayment = async (paymentId) => {
    const stringId = String(paymentId);
    const existingDeleted = safeParse('rehmat_deleted_vendor_payment_ids', []);
    localStorage.setItem('rehmat_deleted_vendor_payment_ids', JSON.stringify(Array.from(new Set([...existingDeleted, stringId]))));

    setVendorPayments((prev) => {
      const updated = prev.filter((p) => String(p.id) !== stringId);
      localStorage.setItem('rehmat_store_vendor_payments_v2', JSON.stringify(updated));
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'vendor_payments', stringId));
    } catch (e) {
      console.error('Firebase deleteVendorPayment error:', e);
    }
  };

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
    deleteVendorPayment
  };
}
