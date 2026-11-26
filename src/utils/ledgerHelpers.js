/**
 * Shared normalization & date range helpers used across Factory Store,
 * Machine Customer, and Retail Shop Mart History & Ledger modules.
 */

export function getTodayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getQuickRangeDates(preset) {
  const today = getTodayISO();
  if (preset === 'today') {
    return { startDate: today, endDate: today };
  }
  if (preset === 'week') {
    const past = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const y = past.getFullYear();
    const m = String(past.getMonth() + 1).padStart(2, '0');
    const d = String(past.getDate()).padStart(2, '0');
    return { startDate: `${y}-${m}-${d}`, endDate: today };
  }
  if (preset === 'month') {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return { startDate: `${y}-${m}-01`, endDate: today };
  }
  return { startDate: '', endDate: '' };
}

export function getActiveRangePreset(startDate, endDate) {
  if (!startDate && !endDate) return 'all';
  const today = getTodayISO();
  if (startDate === today && endDate === today) return 'today';

  const week = getQuickRangeDates('week');
  if (startDate === week.startDate && endDate === week.endDate) return 'week';

  const month = getQuickRangeDates('month');
  if (startDate === month.startDate && endDate === month.endDate) return 'month';

  return 'custom';
}

export function getSlipDateString(record) {
  if (!record) return '';
  if (record.dateISO && typeof record.dateISO === 'string') {
    try {
      const d = new Date(record.dateISO);
      if (!Number.isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    } catch {
      // ignore invalid ISO
    }
  }
  if (record.createdAt) {
    const d = new Date(record.createdAt);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }
  const rawDate = record.date || record.time || record.receivedDate;
  if (rawDate && typeof rawDate === 'string') {
    const isoMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

    const cleaned = rawDate.replace('Today,', '').split(',')[0].trim();
    const parsed = Date.parse(cleaned);
    if (!Number.isNaN(parsed)) {
      const d = new Date(parsed);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }
  return '';
}

export function isRecordInDateRange(record, startDate, endDate) {
  if (!startDate && !endDate) return true;
  const day = getSlipDateString(record);
  if (!day) return true;
  if (startDate && day < startDate) return false;
  if (endDate && day > endDate) return false;
  return true;
}

export function normalizeLineItems(record) {
  if (Array.isArray(record.items) && record.items.length > 0) {
    return record.items.map((it) => {
      const name = it.machineName || it.name || it.itemName || it.title || 'Item';
      const subtitle = it.serialNo ? `S/N: ${it.serialNo}` : it.specification || '';
      const qty = parseInt(it.qty ?? it.quantity ?? 1, 10) || 1;
      let rate = parseFloat(it.unitPrice ?? it.rate ?? it.price ?? 0) || 0;
      let amount = parseFloat(it.lineTotal ?? it.amount ?? 0);
      if (!amount && rate > 0) {
        amount = qty * rate;
      } else if (amount > 0 && !rate && qty > 0) {
        rate = amount / qty;
      }
      return { name, subtitle, qty, rate, amount };
    });
  }

  const totalVal = parseFloat(record.lineTotal ?? record.subTotal ?? record.totalCost ?? record.totalAmount) || 0;
  const qty = parseInt(record.qty ?? 1, 10) || 1;
  const rate = parseFloat(record.unitPrice) || (qty > 0 ? totalVal / qty : totalVal);
  return [
    {
      name: record.machineName || record.itemName || record.notes || 'Material / Machine',
      subtitle: record.serialNo ? `S/N: ${record.serialNo}` : '',
      qty,
      rate,
      amount: totalVal
    }
  ];
}

