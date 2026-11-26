import { useState } from 'react';
import { db } from 'api/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

const DEFAULT_EXPENSE_CATEGORIES = [
  'Utilities',
  'Rent',
  'Salaries',
  'Maintenance',
  'Fuel & Transport',
  'Stationery',
  'Tea & Refreshment',
  'Misc'
];

export function useExpensesModule({ logActivity }) {
  const [expenses, setExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState(DEFAULT_EXPENSE_CATEGORIES);

  const addExpense = async (expenseData) => {
    const newId = expenseData.id || `exp-${Date.now()}`;
    const newExpense = {
      id: newId,
      title: expenseData.title,
      category: expenseData.category || 'General',
      amount: parseFloat(expenseData.amount) || 0,
      paymentMethod: expenseData.paymentMethod || expenseData.payment_method || 'Cash',
      paidTo: expenseData.paidTo || expenseData.paid_to || 'N/A',
      expenseDate: expenseData.expenseDate || expenseData.expense_date || new Date().toISOString().split('T')[0],
      notes: expenseData.notes || '',
      createdAt: new Date().toISOString()
    };

    setExpenses((prev) => [newExpense, ...prev]);
    if (logActivity) {
      logActivity('Expense Added', `Added expense: PKR ${newExpense.amount} for ${newExpense.title}`);
    }

    try {
      await setDoc(doc(db, 'expenses', String(newExpense.id)), {
        id: newExpense.id,
        title: newExpense.title,
        category: newExpense.category,
        amount: newExpense.amount,
        payment_method: newExpense.paymentMethod,
        paid_to: newExpense.paidTo,
        expense_date: newExpense.expenseDate,
        notes: newExpense.notes,
        created_at: newExpense.createdAt
      }, { merge: true });
    } catch (e) {
      console.error('Firebase addExpense Exception:', e);
    }

    return newExpense;
  };

  const deleteExpense = async (expenseId) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    if (logActivity) {
      logActivity('Expense Deleted', `Deleted expense ID: ${expenseId}`);
    }

    try {
      await deleteDoc(doc(db, 'expenses', String(expenseId)));
    } catch (e) {
      console.error('Firebase deleteExpense Exception:', e);
    }
  };

  const addExpenseCategory = (cat) => {
    if (!cat || !cat.trim()) return;
    const trimmed = cat.trim();
    if (!expenseCategories.includes(trimmed)) {
      setExpenseCategories((prev) => [...prev, trimmed]);
    }
  };

  const deleteExpenseCategory = (cat) => {
    setExpenseCategories((prev) => prev.filter((c) => c !== cat));
  };

  return {
    expenses,
    setExpenses,
    expenseCategories,
    setExpenseCategories,
    addExpense,
    deleteExpense,
    addExpenseCategory,
    deleteExpenseCategory
  };
}

