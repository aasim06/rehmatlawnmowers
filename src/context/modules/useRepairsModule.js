import { useState } from 'react';
import { db, setDoc, deleteDoc } from 'api/firebase';
import { doc } from 'firebase/firestore';

const STORAGE_KEY = 'rehmat_store_machine_repairs_v1';
const DELETED_STORAGE_KEY = 'rehmat_deleted_repair_ids';

const safeReadStorage = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const persistRepairsList = (list) => {
  try {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch (e) {
          console.warn('LocalStorage repair save warning:', e);
        }
      });
    } else {
      setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch (e) {
          console.warn('LocalStorage repair save warning:', e);
        }
      }, 0);
    }
  } catch (err) {
    console.warn('LocalStorage repair save warning:', err);
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

const computeNetRepairCost = (partsCost, laborCost, discountAmount) => {
  return Math.max(0, (parseFloat(partsCost) || 0) + (parseFloat(laborCost) || 0) - (parseFloat(discountAmount) || 0));
};

export function useRepairsModule() {
  const [machineRepairs, setMachineRepairs] = useState(() => safeReadStorage(STORAGE_KEY, []));

  const addMachineRepair = async (repairData) => {
    const repairId = generateUUID();
    const repairNo = repairData.repairNo || `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    const partsCost = Math.max(0, parseFloat(repairData.partsCost) || 0);
    const laborCost = Math.max(0, parseFloat(repairData.laborCost) || 0);
    const discountAmount = Math.max(0, parseFloat(repairData.discountAmount) || 0);
    const totalCost = computeNetRepairCost(partsCost, laborCost, discountAmount);
    const paidAmount = Math.max(0, parseFloat(repairData.paidAmount) || 0);
    const balanceAmount = Math.max(0, totalCost - paidAmount);
    const paymentStatus = totalCost > 0 && balanceAmount <= 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending';
    const now = new Date();
    const nowISO = now.toISOString();
    const formattedDate =
      repairData.receivedDate ||
      now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const newRepair = {
      ...repairData,
      id: repairId,
      repairNo,
      partsCost,
      laborCost,
      discountAmount,
      totalCost,
      paidAmount,
      balanceAmount,
      paymentStatus,
      repairStatus: repairData.repairStatus || 'Received',
      receivedDate: formattedDate,
      promisedDate: repairData.promisedDate || '1-2 Days',
      dateISO: repairData.dateISO || nowISO,
      technicianNotes: repairData.technicianNotes || ''
    };

    setMachineRepairs((prev) => {
      const updated = [newRepair, ...prev];
      persistRepairsList(updated);
      return updated;
    });

    try {
      await Promise.race([
        setDoc(
          doc(db, 'machine_repairs', String(repairId)),
          {
            id: repairId,
            repair_no: repairNo,
            customer_name: repairData.customerName || 'Walk-in Customer',
            customer_phone: repairData.customerPhone || 'N/A',
            city_address: repairData.cityAddress || 'Lahore',
            machine_name: repairData.machineName || 'Lawn Mower Machine',
            serial_no: repairData.serialNo || 'N/A',
            fault_description: repairData.faultDescription || 'General Service & Repair',
            parts_cost: partsCost,
            labor_cost: laborCost,
            discount_amount: discountAmount,
            total_cost: totalCost,
            paid_amount: paidAmount,
            balance_amount: balanceAmount,
            payment_status: paymentStatus,
            repair_status: repairData.repairStatus || 'Received',
            received_date: formattedDate,
            promised_date: repairData.promisedDate || '1-2 Days',
            technician_notes: repairData.technicianNotes || '',
            repair_items: repairData.repairItems || [],
            created_at: nowISO
          },
          { merge: true }
        ),
        new Promise((resolve) => setTimeout(resolve, 1200))
      ]);
    } catch (e) {
      console.error('Firebase addMachineRepair Exception:', e);
    }
    return newRepair;
  };

  const updateMachineRepair = async (repairId, updatedFields) => {
    const computeUpdatedRecord = (r) => {
      const partsCost = updatedFields.partsCost !== undefined ? Math.max(0, parseFloat(updatedFields.partsCost) || 0) : r.partsCost;
      const laborCost = updatedFields.laborCost !== undefined ? Math.max(0, parseFloat(updatedFields.laborCost) || 0) : r.laborCost;
      const discountAmount =
        updatedFields.discountAmount !== undefined ? Math.max(0, parseFloat(updatedFields.discountAmount) || 0) : r.discountAmount || 0;
      const totalCost = computeNetRepairCost(partsCost, laborCost, discountAmount);
      const paidAmount = updatedFields.paidAmount !== undefined ? Math.max(0, parseFloat(updatedFields.paidAmount) || 0) : r.paidAmount;
      const balanceAmount = Math.max(0, totalCost - paidAmount);
      const paymentStatus = totalCost > 0 && balanceAmount <= 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending';
      const deliveredDate =
        updatedFields.repairStatus === 'Delivered' && !r.deliveredDate
          ? new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : updatedFields.deliveredDate ?? r.deliveredDate;

      return {
        ...r,
        ...updatedFields,
        partsCost,
        laborCost,
        discountAmount,
        totalCost,
        paidAmount,
        balanceAmount,
        paymentStatus,
        deliveredDate
      };
    };

    const existing = machineRepairs.find((r) => String(r.id) === String(repairId));
    const syncedPayload = existing ? computeUpdatedRecord(existing) : null;

    setMachineRepairs((prev) => {
      const updated = prev.map((r) => (String(r.id) === String(repairId) ? computeUpdatedRecord(r) : r));
      persistRepairsList(updated);
      return updated;
    });

    try {
      const updatePayload = {};
      if (updatedFields.customerName !== undefined) updatePayload.customer_name = updatedFields.customerName;
      if (updatedFields.customerPhone !== undefined) updatePayload.customer_phone = updatedFields.customerPhone;
      if (updatedFields.cityAddress !== undefined) updatePayload.city_address = updatedFields.cityAddress;
      if (updatedFields.machineName !== undefined) updatePayload.machine_name = updatedFields.machineName;
      if (updatedFields.serialNo !== undefined) updatePayload.serial_no = updatedFields.serialNo;
      if (updatedFields.faultDescription !== undefined) updatePayload.fault_description = updatedFields.faultDescription;
      if (updatedFields.promisedDate !== undefined) updatePayload.promised_date = updatedFields.promisedDate;
      if (updatedFields.technicianNotes !== undefined) updatePayload.technician_notes = updatedFields.technicianNotes;
      if (updatedFields.repairItems !== undefined) updatePayload.repair_items = updatedFields.repairItems;
      if (updatedFields.repairStatus !== undefined) updatePayload.repair_status = updatedFields.repairStatus;
      if (syncedPayload) {
        updatePayload.parts_cost = syncedPayload.partsCost;
        updatePayload.labor_cost = syncedPayload.laborCost;
        updatePayload.discount_amount = syncedPayload.discountAmount;
        updatePayload.total_cost = syncedPayload.totalCost;
        updatePayload.paid_amount = syncedPayload.paidAmount;
        updatePayload.balance_amount = syncedPayload.balanceAmount;
        updatePayload.payment_status = syncedPayload.paymentStatus;
        if (syncedPayload.deliveredDate) updatePayload.delivered_date = syncedPayload.deliveredDate;
      }
      await Promise.race([
        setDoc(doc(db, 'machine_repairs', String(repairId)), updatePayload, { merge: true }),
        new Promise((resolve) => setTimeout(resolve, 1500))
      ]);
    } catch (e) {
      console.error('Firebase updateMachineRepair Exception:', e);
    }
  };

  const deleteMachineRepair = async (repairId) => {
    const strId = String(repairId);
    const existingDeleted = safeReadStorage(DELETED_STORAGE_KEY, []);
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(Array.from(new Set([...existingDeleted, strId]))));

    setMachineRepairs((prev) => {
      const updated = prev.filter((r) => String(r.id) !== strId);
      persistRepairsList(updated);
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'machine_repairs', strId));
    } catch (e) {
      console.error('Firebase deleteMachineRepair Exception:', e);
    }
  };

  return {
    machineRepairs,
    setMachineRepairs,
    addMachineRepair,
    updateMachineRepair,
    deleteMachineRepair
  };
}
