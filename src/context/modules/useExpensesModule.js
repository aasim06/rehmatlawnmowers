import { useState, useCallback } from 'react';
import { db, CLOUD_SYNC_ENABLED, setDoc, deleteDoc, getDocs, syncWithTimeout } from 'api/firebase';
import { collection, doc } from 'firebase/firestore';

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Tea & Refreshment',
  'Fuel & Transport',
  'Utilities & Bills',
  'Staff Wages & Labor',
  'Shop Maintenance & Tools',
  'Stationery & Office',
  'Miscellaneous & Others',
  'Utilities',
  'Rent',
  'Salaries',
  'Maintenance',
  'Stationery',
  'Misc'
];

const EXPENSE_BASE_CATEGORIES = [
  'Tea & Refreshment',
  'Fuel & Transport',
  'Utilities & Bills',
  'Staff Wages & Labor',
  'Shop Maintenance & Tools',
  'Stationery & Office',
  'Miscellaneous & Others'
];

const STORAGE_KEYS = {
  expenses: 'rehmat_store_expenses_v1',
  funds: 'rehmat_store_expense_funds_v1',
  categories: 'rehmat_store_expense_categories_v1',
  deletedExpenses: 'rehmat_deleted_expense_ids',
  pendingExpenses: 'rehmat_pending_expense_ids',
  deletedFunds: 'rehmat_deleted_expense_fund_ids',
  pendingFunds: 'rehmat_pending_expense_fund_ids'
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

const getActiveActorName = () => {
  try {
    const activeRaw = sessionStorage.getItem('rehmat_erp_active_user');
    if (activeRaw) {
      const parsed = JSON.parse(activeRaw);
      if (parsed?.name) return parsed.name;
      if (parsed?.email) return parsed.email;
    }
  } catch {}
  return 'Counter / Admin';
};

export const getLocalDateISO = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toFirestoreExpensePayload = (exp) => ({
  id: exp.id,
  title: exp.title,
  category: exp.category,
  amount: exp.amount,
  payment_method: exp.paymentMethod,
  paymentMethod: exp.paymentMethod,
  paid_to: exp.paidTo,
  paidTo: exp.paidTo,
  expense_date: exp.expenseDate,
  expenseDate: exp.expenseDate,
  notes: exp.notes || '',
  added_by: exp.addedBy || 'Counter',
  addedBy: exp.addedBy || 'Counter',
  created_at: exp.createdAt,
  createdAt: exp.createdAt
});

const toFirestoreFundPayload = (fund) => ({
  id: fund.id,
  entry_type: fund.entryType || 'received',
  entryType: fund.entryType || 'received',
  amount: fund.amount,
  fund_date: fund.fundDate,
  fundDate: fund.fundDate,
  received_from: fund.receivedFrom,
  receivedFrom: fund.receivedFrom,
  payment_method: fund.paymentMethod,
  paymentMethod: fund.paymentMethod,
  notes: fund.notes || '',
  added_by: fund.addedBy || 'Counter',
  addedBy: fund.addedBy || 'Counter',
  created_at: fund.createdAt,
  createdAt: fund.createdAt
});

export function useExpensesModule({ logActivity }) {
  const [expenses, setExpenses] = useState(() => safeParse(STORAGE_KEYS.expenses, []));
  const [expenseFunds, setExpenseFunds] = useState(() => safeParse(STORAGE_KEYS.funds, []));
  const [expenseCategories, setExpenseCategories] = useState(() => {
    const saved = safeParse(STORAGE_KEYS.categories, null);
    if (Array.isArray(saved) && saved.length > 0) return saved;
    return EXPENSE_BASE_CATEGORIES;
  });

  const addExpense = async (expenseData) => {
    const newId = String(expenseData.id || `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
    const newExpense = {
      id: newId,
      title: (expenseData.title || '').trim(),
      category: expenseData.category || 'General',
      amount: parseFloat(expenseData.amount) || 0,
      paymentMethod: expenseData.paymentMethod || expenseData.payment_method || 'Cash',
      paidTo: (expenseData.paidTo || expenseData.paid_to || 'N/A').trim(),
      expenseDate: expenseData.expenseDate || expenseData.expense_date || getLocalDateISO(),
      notes: (expenseData.notes || '').trim(),
      addedBy: expenseData.addedBy || getActiveActorName(),
      createdAt: new Date().toISOString()
    };

    untrackId(STORAGE_KEYS.deletedExpenses, newId);
    trackId(STORAGE_KEYS.pendingExpenses, newId);

    setExpenses((prev) => {
      const updated = [newExpense, ...prev];
      persistJSON(STORAGE_KEYS.expenses, updated);
      return updated;
    });

    if (logActivity) {
      logActivity('Expense Added', `Added expense: PKR ${newExpense.amount} for ${newExpense.title}`);
    }

    await syncWithTimeout(
      setDoc(doc(db, 'expenses', newId), toFirestoreExpensePayload(newExpense), { merge: true })
        .then(() => untrackId(STORAGE_KEYS.pendingExpenses, newId))
        .catch((e) => console.error('Firebase addExpense Exception:', e))
    );

    return newExpense;
  };

  const deleteExpense = async (expenseId) => {
    const strId = String(expenseId);
    trackId(STORAGE_KEYS.deletedExpenses, strId);
    untrackId(STORAGE_KEYS.pendingExpenses, strId);

    setExpenses((prev) => {
      const updated = prev.filter((e) => String(e.id) !== strId);
      persistJSON(STORAGE_KEYS.expenses, updated);
      return updated;
    });

    if (logActivity) {
      logActivity('Expense Deleted', `Deleted expense ID: ${strId}`);
    }

    await syncWithTimeout(
      deleteDoc(doc(db, 'expenses', strId)).catch((e) => console.error('Firebase deleteExpense Exception:', e))
    );
  };

  const addExpenseFund = async (fundData) => {
    const newId = String(fundData.id || `fund-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
    const entryType = fundData.entryType === 'returned' ? 'returned' : 'received';
    const newFund = {
      id: newId,
      entryType,
      amount: parseFloat(fundData.amount) || 0,
      fundDate: fundData.fundDate || fundData.fund_date || getLocalDateISO(),
      receivedFrom: (
        fundData.receivedFrom ||
        fundData.received_from ||
        (entryType === 'returned' ? 'Returned to Owner' : 'Owner / Company Cash')
      ).trim(),
      paymentMethod: fundData.paymentMethod || fundData.payment_method || 'Cash',
      notes: (fundData.notes || '').trim(),
      addedBy: fundData.addedBy || getActiveActorName(),
      createdAt: new Date().toISOString()
    };

    untrackId(STORAGE_KEYS.deletedFunds, newId);
    trackId(STORAGE_KEYS.pendingFunds, newId);

    setExpenseFunds((prev) => {
      const updated = [newFund, ...prev];
      persistJSON(STORAGE_KEYS.funds, updated);
      return updated;
    });

    if (logActivity) {
      logActivity(
        entryType === 'returned' ? 'Cash Returned to Owner' : 'Cash in Hand Added',
        `${entryType === 'returned' ? 'Returned' : 'Received'} PKR ${newFund.amount} (${newFund.receivedFrom}) on ${newFund.fundDate}`
      );
    }

    await syncWithTimeout(
      setDoc(doc(db, 'expense_funds', newId), toFirestoreFundPayload(newFund), { merge: true })
        .then(() => untrackId(STORAGE_KEYS.pendingFunds, newId))
        .catch((e) => console.error('Firebase addExpenseFund Exception:', e))
    );

    return newFund;
  };

  const updateExpenseFund = async (fundId, updatedFields) => {
    const strId = String(fundId);
    let updatedPayload = null;
    trackId(STORAGE_KEYS.pendingFunds, strId);

    setExpenseFunds((prev) => {
      const updated = prev.map((f) => {
        if (String(f.id) === strId) {
          updatedPayload = {
            ...f,
            ...updatedFields,
            amount: updatedFields.amount !== undefined ? parseFloat(updatedFields.amount) || 0 : f.amount
          };
          return updatedPayload;
        }
        return f;
      });
      persistJSON(STORAGE_KEYS.funds, updated);
      return updated;
    });

    if (updatedPayload) {
      await syncWithTimeout(
        setDoc(doc(db, 'expense_funds', strId), toFirestoreFundPayload(updatedPayload), { merge: true })
          .then(() => untrackId(STORAGE_KEYS.pendingFunds, strId))
          .catch((e) => console.error('Firebase updateExpenseFund Exception:', e))
      );
    }
    return updatedPayload;
  };

  const deleteExpenseFund = async (fundId) => {
    const strId = String(fundId);
    trackId(STORAGE_KEYS.deletedFunds, strId);
    untrackId(STORAGE_KEYS.pendingFunds, strId);

    setExpenseFunds((prev) => {
      const updated = prev.filter((f) => String(f.id) !== strId);
      persistJSON(STORAGE_KEYS.funds, updated);
      return updated;
    });

    if (logActivity) {
      logActivity('Cash in Hand Deleted', `Deleted cash fund ID: ${strId}`);
    }

    await syncWithTimeout(
      deleteDoc(doc(db, 'expense_funds', strId)).catch((e) => console.error('Firebase deleteExpenseFund Exception:', e))
    );
  };

  const addExpenseCategory = async (cat) => {
    if (!cat || !cat.trim()) return;
    const trimmed = cat.trim();
    const docId = `expcat-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    setExpenseCategories((prev) => {
      if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return prev;
      const next = [...prev, trimmed];
      persistJSON(STORAGE_KEYS.categories, next);
      return next;
    });

    await syncWithTimeout(
      setDoc(
        doc(db, 'expense_categories', docId),
        { id: docId, name: trimmed, updatedAt: new Date().toISOString() },
        { merge: true }
      ).catch((e) => console.warn('Firebase addExpenseCategory warning:', e))
    );
  };

  const deleteExpenseCategory = async (cat) => {
    const docId = `expcat-${String(cat).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    setExpenseCategories((prev) => {
      const next = prev.filter((c) => c !== cat);
      persistJSON(STORAGE_KEYS.categories, next);
      return next;
    });

    await syncWithTimeout(
      deleteDoc(doc(db, 'expense_categories', docId)).catch((e) => console.warn('Firebase deleteExpenseCategory warning:', e))
    );
  };

  const syncExpensesFromCloud = useCallback(async () => {
    if (!CLOUD_SYNC_ENABLED || (typeof navigator !== 'undefined' && !navigator.onLine)) return;

    const deletedExpenseSet = new Set(safeParse(STORAGE_KEYS.deletedExpenses, []).map(String));
    const deletedFundSet = new Set(safeParse(STORAGE_KEYS.deletedFunds, []).map(String));

    // 1. Flush any locally queued offline expenses/funds to Firestore first
    const pendingExpenseIds = safeParse(STORAGE_KEYS.pendingExpenses, []).map(String);
    if (pendingExpenseIds.length > 0) {
      const localExpenses = safeParse(STORAGE_KEYS.expenses, []);
      await Promise.allSettled(
        pendingExpenseIds.map(async (id) => {
          const item = localExpenses.find((e) => String(e.id) === id);
          if (!item || deletedExpenseSet.has(id)) {
            untrackId(STORAGE_KEYS.pendingExpenses, id);
            return;
          }
          await setDoc(doc(db, 'expenses', id), toFirestoreExpensePayload(item), { merge: true });
          untrackId(STORAGE_KEYS.pendingExpenses, id);
        })
      );
    }

    const pendingFundIds = safeParse(STORAGE_KEYS.pendingFunds, []).map(String);
    if (pendingFundIds.length > 0) {
      const localFunds = safeParse(STORAGE_KEYS.funds, []);
      await Promise.allSettled(
        pendingFundIds.map(async (id) => {
          const item = localFunds.find((f) => String(f.id) === id);
          if (!item || deletedFundSet.has(id)) {
            untrackId(STORAGE_KEYS.pendingFunds, id);
            return;
          }
          await setDoc(doc(db, 'expense_funds', id), toFirestoreFundPayload(item), { merge: true });
          untrackId(STORAGE_KEYS.pendingFunds, id);
        })
      );
    }

    // 2. Fetch fresh expenses, expense_funds, and custom expense_categories from Firestore
    const [expSnap, fundsSnap, expCatsSnap] = await Promise.allSettled([
      getDocs(collection(db, 'expenses')),
      getDocs(collection(db, 'expense_funds')),
      getDocs(collection(db, 'expense_categories'))
    ]);

    if (expSnap.status === 'fulfilled' && expSnap.value?.docs) {
      const remoteExpenses = expSnap.value.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((e) => !deletedExpenseSet.has(String(e.id)))
        .map((e) => ({
          id: e.id,
          title: e.title || '',
          category: e.category || 'General',
          amount: parseFloat(e.amount) || 0,
          paymentMethod: e.payment_method || e.paymentMethod || 'Cash',
          paidTo: e.paid_to || e.paidTo || 'N/A',
          expenseDate:
            e.expense_date ||
            e.expenseDate ||
            (e.created_at || e.createdAt ? getLocalDateISO(new Date(e.created_at || e.createdAt)) : getLocalDateISO()),
          notes: e.notes || '',
          addedBy: e.added_by || e.addedBy || 'Counter',
          createdAt: e.created_at || e.createdAt || new Date().toISOString()
        }));

      const remoteIds = new Set(remoteExpenses.map((e) => String(e.id)));
      const stillPending = safeParse(STORAGE_KEYS.pendingExpenses, []).map(String).filter((id) => !remoteIds.has(id) && !deletedExpenseSet.has(id));
      persistJSON(STORAGE_KEYS.pendingExpenses, stillPending);
      const pendingSet = new Set(stillPending);
      const localExpenses = safeParse(STORAGE_KEYS.expenses, []);
      const unsynced = localExpenses.filter((e) => pendingSet.has(String(e.id)) && !remoteIds.has(String(e.id)));
      const merged = [...unsynced, ...remoteExpenses].sort(
        (a, b) => new Date(b.createdAt || b.expenseDate || 0) - new Date(a.createdAt || a.expenseDate || 0)
      );

      if (merged.length > 0 || !expSnap.value.metadata?.fromCache) {
        setExpenses(merged);
        persistJSON(STORAGE_KEYS.expenses, merged);
      }
    }

    if (fundsSnap.status === 'fulfilled' && fundsSnap.value?.docs) {
      const remoteFunds = fundsSnap.value.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((f) => !deletedFundSet.has(String(f.id)))
        .map((f) => ({
          id: f.id,
          entryType: f.entry_type === 'returned' || f.entryType === 'returned' ? 'returned' : 'received',
          amount: parseFloat(f.amount) || 0,
          fundDate:
            f.fund_date ||
            f.fundDate ||
            (f.created_at || f.createdAt ? getLocalDateISO(new Date(f.created_at || f.createdAt)) : getLocalDateISO()),
          receivedFrom: f.received_from || f.receivedFrom || 'Owner / Company Cash',
          paymentMethod: f.payment_method || f.paymentMethod || 'Cash',
          notes: f.notes || '',
          addedBy: f.added_by || f.addedBy || 'Counter',
          createdAt: f.created_at || f.createdAt || new Date().toISOString()
        }));

      const remoteIds = new Set(remoteFunds.map((f) => String(f.id)));
      const stillPending = safeParse(STORAGE_KEYS.pendingFunds, []).map(String).filter((id) => !remoteIds.has(id) && !deletedFundSet.has(id));
      persistJSON(STORAGE_KEYS.pendingFunds, stillPending);
      const pendingSet = new Set(stillPending);
      const localFunds = safeParse(STORAGE_KEYS.funds, []);
      const unsynced = localFunds.filter((f) => pendingSet.has(String(f.id)) && !remoteIds.has(String(f.id)));
      const mergedFunds = [...unsynced, ...remoteFunds].sort(
        (a, b) => new Date(b.createdAt || b.fundDate || 0) - new Date(a.createdAt || a.fundDate || 0)
      );

      if (mergedFunds.length > 0 || !fundsSnap.value.metadata?.fromCache) {
        setExpenseFunds(mergedFunds);
        persistJSON(STORAGE_KEYS.funds, mergedFunds);
      }
    }

    if (expCatsSnap.status === 'fulfilled' && expCatsSnap.value?.docs && expCatsSnap.value.docs.length > 0) {
      const remoteNames = expCatsSnap.value.docs.map((d) => (d.data()?.name || '').trim()).filter(Boolean);
      const seen = new Set();
      const mergedCats = [...EXPENSE_BASE_CATEGORIES, ...remoteNames].filter((name) => {
        const lower = name.toLowerCase();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
      });
      setExpenseCategories(mergedCats);
      persistJSON(STORAGE_KEYS.categories, mergedCats);
    }
  }, []);

  return {
    expenses,
    setExpenses,
    expenseFunds,
    setExpenseFunds,
    expenseCategories,
    setExpenseCategories,
    addExpense,
    deleteExpense,
    addExpenseFund,
    updateExpenseFund,
    deleteExpenseFund,
    addExpenseCategory,
    deleteExpenseCategory,
    syncExpensesFromCloud
  };
}
