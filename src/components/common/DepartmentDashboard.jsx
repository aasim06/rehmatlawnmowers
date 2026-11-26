import PropTypes from 'prop-types';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

import BuildOutlined from '@ant-design/icons/BuildOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import DatabaseOutlined from '@ant-design/icons/DatabaseOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import ExportOutlined from '@ant-design/icons/ExportOutlined';
import FileTextOutlined from '@ant-design/icons/FileTextOutlined';
import ImportOutlined from '@ant-design/icons/ImportOutlined';
import InboxOutlined from '@ant-design/icons/InboxOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import ShopOutlined from '@ant-design/icons/ShopOutlined';
import ShoppingCartOutlined from '@ant-design/icons/ShoppingCartOutlined';
import ToolOutlined from '@ant-design/icons/ToolOutlined';
import WalletOutlined from '@ant-design/icons/WalletOutlined';
import WarningOutlined from '@ant-design/icons/WarningOutlined';

import { useStoreInventory } from 'context/StoreInventoryContext';
import usePermission from 'hooks/usePermission';
import MasterDashboard from './MasterDashboard';
import { formatCategoryLabel } from 'utils/formatText';
import {
  buildBillingSummaryMetrics,
  buildBillingTimeSeries,
  buildCategoryBreakdown,
  buildInventoryTimeSeries,
  computeStockHealthPct,
  formatFriendlyDateTime,
  formatPKR
} from 'utils/dashboardHelpers';
import { getTodayISO, isRecordInDateRange } from 'utils/ledgerHelpers';
import {
  buildCustomerLedgers,
  formatInvoiceNo,
  formatItemsSummaryLabel,
  resolveRepairFinancials,
  resolveSaleFinancials
} from 'utils/machineLedgerHelpers';
import { buildShopCustomerLedgers, normalizeShopSaleRecord, resolveShopSaleFinancials } from 'utils/shopHelpers';
import {
  buildFactoryStoreLedgers,
  buildUnifiedStoreCashbook,
  summarizeFactoryStoreFinance
} from 'utils/storeLedgerHelpers';

function buildVoucherFeedEntry(pay, paymentsPath) {
  const isPayout = pay.entryType === 'Payout';
  return {
    id: `pay-${pay.id}`,
    filterKey: 'PAYMENT',
    sortTime: new Date(pay.createdAt || pay.dateISO || 0).getTime() || 0,
    icon: <DollarOutlined />,
    tone: isPayout ? 'error' : 'success',
    title: `${pay.customerName || 'Customer'} (${isPayout ? 'Paid Out' : 'Cash Received'})`,
    badge: pay.paymentMethod || 'Cash',
    badgeColor: isPayout ? 'error' : 'success',
    subtitle: `${pay.voucherNo || formatInvoiceNo(pay)} • ${pay.referenceLabel || pay.referenceType || 'On Account'} • ${pay.time || ''}`,
    rightPrimary: formatPKR(pay.amountPaid),
    rightSecondary: isPayout ? 'Cash Out / Refund' : 'Payment Credited',
    to: paymentsPath
  };
}

function buildDueWatchlistRows(ledgers, paymentsPath, fallbackLocation = 'No Phone') {
  return (ledgers || [])
    .filter((c) => c.balanceVal > 0)
    .slice(0, 5)
    .map((cust) => ({
      id: `due-${cust.key}`,
      title: cust.customerName,
      subtitle: `${cust.totalInvoicesCount} Invoice(s) • ${cust.phone || fallbackLocation}`,
      statusText: `Due ${formatPKR(cust.balanceVal)}`,
      chipColor: 'error',
      tone: 'error',
      urgent: true,
      to: paymentsPath
    }));
}

function buildFinancialDeptConfig({
  theme,
  activeDepartment,
  title,
  subtitle,
  badgeLabel,
  headerIcon,
  quickActions,
  alertBanner,
  healthyMessage,
  billingKpi,
  collectedKpiHelper,
  fourthKpi,
  metrics,
  chartTitle,
  chartSubtitle,
  chartSeries,
  emptyChartTitle,
  emptyChartSubtitle,
  overviewTitle,
  overviewSubtitle,
  collectionHelper,
  breakdownTitle,
  emptyBreakdownText,
  breakdownItems,
  activityTitle,
  activitySubtitle,
  activityFilters,
  emptyActivityTitle,
  emptyActivitySubtitle,
  activityItems,
  watchlistTitle,
  watchlistSubtitle,
  emptyWatchlistTitle,
  emptyWatchlistSubtitle,
  watchlistItems,
  invoicesPath,
  paymentsPath
}) {
  return {
    activeDepartment,
    title,
    subtitle,
    badgeLabel,
    headerIcon,
    quickActions,
    alertBanner,
    healthyMessage,
    kpis: [
      { ...billingKpi, icon: <FileTextOutlined />, tone: 'primary', to: invoicesPath },
      {
        label: 'Cash Collected',
        value: formatPKR(metrics.totalCollected),
        helper: collectedKpiHelper,
        icon: <CheckCircleOutlined />,
        tone: 'success',
        highlightValue: true,
        to: paymentsPath
      },
      {
        label: 'Pending Receivables',
        value: formatPKR(metrics.totalReceivables),
        helper:
          metrics.unpaidAccountsCount > 0 ? `${metrics.unpaidAccountsCount} account(s) with balance due` : 'All accounts settled in full',
        icon: metrics.totalReceivables > 0 ? <WarningOutlined /> : <DollarOutlined />,
        tone: metrics.totalReceivables > 0 ? 'error' : 'success',
        highlightValue: metrics.totalReceivables > 0,
        to: paymentsPath
      },
      fourthKpi
    ],
    chartConfig: {
      title: chartTitle,
      subtitle: chartSubtitle,
      defaultView: 'monthly',
      emptyTitle: emptyChartTitle,
      emptySubtitle: emptyChartSubtitle,
      weekly: {
        type: 'bar',
        labels: chartSeries.weeklyLabels,
        series: [
          { label: 'Billed Amount', data: chartSeries.weeklyBilled, color: theme.palette.primary.main },
          { label: 'Cash Collected', data: chartSeries.weeklyPaid, color: theme.palette.success.main }
        ]
      },
      monthly: {
        type: 'line',
        labels: chartSeries.monthlyLabels,
        series: [
          { label: 'Billed Amount', data: chartSeries.monthlyBilled, color: theme.palette.primary.main },
          { label: 'Cash Collected', data: chartSeries.monthlyPaid, color: theme.palette.success.main }
        ]
      }
    },
    overviewPanel: {
      title: overviewTitle,
      subtitle: overviewSubtitle,
      health: {
        label: 'Payment Collection Rate',
        percent: metrics.collectionPct,
        statusLabel: metrics.collectionPct >= 75 ? 'Strong' : metrics.collectionPct >= 45 ? 'Moderate' : 'Follow Up',
        helper: collectionHelper
      },
      breakdownTitle,
      emptyText: emptyBreakdownText,
      breakdownItems
    },
    activityPanel: {
      title: activityTitle,
      subtitle: activitySubtitle,
      viewAllTo: invoicesPath,
      viewAllLabel: 'All Invoices',
      filters: activityFilters,
      emptyTitle: emptyActivityTitle,
      emptySubtitle: emptyActivitySubtitle,
      items: activityItems
    },
    watchlistPanel: {
      title: watchlistTitle,
      subtitle: watchlistSubtitle,
      viewAllTo: paymentsPath,
      viewAllLabel: 'View Payments',
      emptyTitle: emptyWatchlistTitle,
      emptySubtitle: emptyWatchlistSubtitle,
      items: watchlistItems
    }
  };
}

function buildFactoryStoreConfig({
  theme,
  items = [],
  usageLogs = [],
  vendors = [],
  storeCustomers = [],
  storePayments = [],
  vendorPayments = [],
  totalInventoryCount = 0,
  totalValuation = 0,
  todayStockInQty = 0,
  todayStockOutQty = 0,
  lowStockAlerts = []
}) {
  const timeSeries = buildInventoryTimeSeries(usageLogs);
  const categoryBreakdown = buildCategoryBreakdown(items, (item) => parseInt(item.remainingStock ?? item.totalStock, 10) || 0);
  const stockHealthPct = computeStockHealthPct(items, lowStockAlerts);

  const storeCashbook = buildUnifiedStoreCashbook({ storePayments, vendorPayments });
  const storeLedgers = buildFactoryStoreLedgers({ storeCustomers, vendors, usageLogs, storePayments, vendorPayments });
  const finance = summarizeFactoryStoreFinance(storeLedgers, storeCashbook, getTodayISO());

  const financialBreakdown = [
    ...(finance.totalReceivable > 0 || finance.totalSalesBilled > 0
      ? [
          {
            label: `Receivable (${finance.receivableAccountsCount} ${finance.receivableAccountsCount === 1 ? 'party' : 'parties'})`,
            valueText: formatPKR(finance.totalReceivable),
            percent:
              finance.totalSalesBilled > 0
                ? Math.min(100, Math.round((finance.totalReceivable / finance.totalSalesBilled) * 100))
                : 100,
            tone: finance.totalReceivable > 0 ? 'error' : 'success'
          }
        ]
      : []),
    ...(finance.totalPayable > 0 || finance.totalPurchasesBilled > 0
      ? [
          {
            label: `Vendor Payable (${finance.payableAccountsCount} ${finance.payableAccountsCount === 1 ? 'vendor' : 'vendors'})`,
            valueText: formatPKR(finance.totalPayable),
            percent:
              finance.totalPurchasesBilled > 0
                ? Math.min(100, Math.round((finance.totalPayable / finance.totalPurchasesBilled) * 100))
                : 100,
            tone: finance.totalPayable > 0 ? 'warning' : 'success'
          }
        ]
      : [])
  ];

  const activityItems = [
    ...usageLogs.slice(0, 12).map((log) => {
      const isIn = String(log.type || '').toUpperCase().includes('IN');
      const qty = Math.abs(parseInt(log.qtyUsed, 10) || 0);
      return {
        id: log.id,
        filterKey: isIn ? 'IN' : 'OUT',
        sortTime: new Date(log.dateISO || log.created_at || 0).getTime() || 0,
        icon: isIn ? <ImportOutlined /> : <ExportOutlined />,
        tone: isIn ? 'success' : 'primary',
        title: log.itemName || 'Store Item',
        badge: isIn ? 'Stock In' : 'Issued',
        badgeColor: isIn ? 'success' : 'primary',
        subtitle: `${log.usedBy || (isIn ? 'Supplier' : 'Operator')} • ${log.department || 'Factory Store'} • ${formatFriendlyDateTime(log)}`,
        rightPrimary: isIn ? `+${qty}` : `−${qty}`,
        rightSecondary: log.lineTotal ? formatPKR(log.lineTotal) : `${log.remainingStockAfter ?? 0} remaining`,
        to: isIn ? '/inventory/stock-in' : '/inventory/stock-out'
      };
    }),
    ...storeCashbook.slice(0, 8).map((pay) => buildVoucherFeedEntry(pay, '/inventory/store-payments'))
  ].sort((a, b) => (b.sortTime || 0) - (a.sortTime || 0));

  const watchlistItems = [
    ...storeLedgers
      .filter((p) => p.balanceVal > 0 || p.payableVal > 0)
      .slice(0, 4)
      .map((party) => ({
        id: `khata-${party.key}`,
        title: party.customerName,
        subtitle: party.balanceVal > 0 ? 'Receivable from party' : 'Payable to vendor / party',
        statusText: party.balanceVal > 0 ? `Receivable ${formatPKR(party.balanceVal)}` : `Payable ${formatPKR(party.payableVal)}`,
        chipColor: party.balanceVal > 0 ? 'error' : 'warning',
        tone: party.balanceVal > 0 ? 'error' : 'warning',
        urgent: party.balanceVal > 0,
        to: '/inventory/store-payments'
      })),
    ...lowStockAlerts.slice(0, 4).map((item) => {
      const stockLeft = parseInt(item.remainingStock ?? item.totalStock, 10) || 0;
      const minLvl = parseInt(item.minLevel, 10) || 10;
      return {
        id: item.id,
        title: item.name || 'Unnamed Part',
        subtitle: `${formatCategoryLabel(item.category || 'General')} • Min level: ${minLvl} ${item.unit || 'pcs'}`,
        statusText: stockLeft === 0 ? 'Out of Stock' : `${stockLeft} ${item.unit || 'pcs'} left`,
        chipColor: stockLeft === 0 ? 'error' : 'warning',
        tone: stockLeft === 0 ? 'error' : 'warning',
        urgent: true,
        to: '/inventory/items'
      };
    })
  ];

  const storeAlerts = [];
  if (finance.totalReceivable > 0) storeAlerts.push(`Receivable: ${formatPKR(finance.totalReceivable)}`);
  if (finance.totalPayable > 0) storeAlerts.push(`Vendor Payable: ${formatPKR(finance.totalPayable)}`);
  if (lowStockAlerts.length > 0) storeAlerts.push(`${lowStockAlerts.length} low stock item(s)`);

  return {
    activeDepartment: 'factory-store',
    title: 'Factory Store Dashboard',
    subtitle: 'Raw materials inventory, daily inward/outward stock & full party ledger accounting',
    badgeLabel: 'Store Live',
    headerIcon: <DatabaseOutlined />,
    quickActions: [
      { label: 'Store Payments', icon: <WalletOutlined />, to: '/inventory/store-payments', variant: 'outlined' },
      { label: 'Store Party Ledger', icon: <FileTextOutlined />, to: '/inventory/store-ledger', variant: 'outlined' },
      { label: 'Receive Stock (IN)', icon: <ImportOutlined />, to: '/inventory/stock-in', variant: 'outlined' },
      { label: 'Issue to Floor (OUT)', icon: <ExportOutlined />, to: '/inventory/stock-out', variant: 'contained' }
    ],
    alertBanner:
      storeAlerts.length > 0
        ? {
            severity: finance.totalReceivable > 0 || lowStockAlerts.length > 0 ? 'warning' : 'info',
            message: `Factory Store Summary: ${storeAlerts.join(' • ')}.`,
            actionLabel: finance.totalReceivable > 0 || finance.totalPayable > 0 ? 'Open Store Payments' : 'Check Low Stock',
            actionTo: finance.totalReceivable > 0 || finance.totalPayable > 0 ? '/inventory/store-payments' : '/inventory/items'
          }
        : null,
    healthyMessage:
      items.length > 0
        ? `All ${items.length} store items are stocked cleanly and ${finance.totalReceivable === 0 && finance.totalPayable === 0 ? 'all store accounts are settled' : 'store accounts are tracked live'}.`
        : null,
    kpis: [
      {
        label: 'Total Store Worth',
        value: formatPKR(totalValuation),
        helper: `${totalInventoryCount.toLocaleString()} units across ${items.length} items`,
        icon: <DollarOutlined />,
        tone: 'primary',
        to: '/inventory/items'
      },
      {
        label: 'Store Receivable',
        value: formatPKR(finance.totalReceivable),
        helper:
          finance.receivableAccountsCount > 0
            ? `${finance.receivableAccountsCount} party(s) • Today In: +${todayStockInQty || 0}`
            : `Collected: ${formatPKR(finance.totalCollected)} • Today In: +${todayStockInQty || 0}`,
        icon: <ImportOutlined />,
        tone: finance.totalReceivable > 0 ? 'error' : 'success',
        highlightValue: finance.totalReceivable > 0,
        to: '/inventory/store-payments'
      },
      {
        label: 'Vendor Payable',
        value: formatPKR(finance.totalPayable),
        helper:
          finance.payableAccountsCount > 0
            ? `${finance.payableAccountsCount} vendor(s) due • Today Out: −${todayStockOutQty || 0}`
            : `Paid Out: ${formatPKR(finance.totalPaidOut)} • Today Out: −${todayStockOutQty || 0}`,
        icon: <WalletOutlined />,
        tone: finance.totalPayable > 0 ? 'warning' : 'success',
        highlightValue: finance.totalPayable > 0,
        to: '/inventory/store-payments'
      },
      {
        label: 'Low Stock Watch',
        value: `${lowStockAlerts.length} Items`,
        helper: lowStockAlerts.length > 0 ? 'Need restocking soon' : 'All stock levels healthy',
        icon: lowStockAlerts.length > 0 ? <WarningOutlined /> : <InboxOutlined />,
        tone: lowStockAlerts.length > 0 ? 'error' : 'success',
        highlightValue: lowStockAlerts.length > 0,
        to: '/inventory/items'
      }
    ],
    chartConfig: {
      title: 'Store Stock Movement',
      subtitle: 'Parts received (Stock In) vs parts issued to production floor (Stock Out)',
      defaultView: 'weekly',
      emptyTitle: 'No store movement recorded for this period yet',
      emptySubtitle: 'Record a Stock In or Floor Issue entry to see your real-time flow graph.',
      weekly: {
        type: 'bar',
        labels: timeSeries.weeklyLabels,
        series: [
          { label: 'Stock In', data: timeSeries.weeklyIn, color: theme.palette.success.main },
          { label: 'Stock Out', data: timeSeries.weeklyOut, color: theme.palette.primary.main }
        ]
      },
      monthly: {
        type: 'line',
        labels: timeSeries.monthlyLabels,
        series: [
          { label: 'Stock In', data: timeSeries.monthlyIn, color: theme.palette.success.main },
          { label: 'Stock Out', data: timeSeries.monthlyOut, color: theme.palette.primary.main }
        ]
      }
    },
    overviewPanel: {
      title: 'Store Health & Accounts Summary',
      subtitle: 'Live inventory readiness & account balances',
      health: {
        label: 'Overall Stock Health',
        percent: stockHealthPct,
        statusLabel: stockHealthPct >= 75 ? 'Optimal' : stockHealthPct >= 45 ? 'Monitor' : 'Critical',
        helper:
          lowStockAlerts.length > 0
            ? `${lowStockAlerts.length} of ${items.length} items below minimum threshold`
            : `${items.length} active store parts safely stocked`
      },
      breakdownTitle: 'Account Balances & Top Stocked Categories',
      emptyText: 'Add store items or stock transactions to view breakdowns.',
      breakdownItems: [...financialBreakdown, ...categoryBreakdown].slice(0, 5)
    },
    activityPanel: {
      title: 'Live Store Activity & Vouchers',
      subtitle: 'Latest Stock In, Stock Out & Cashbook vouchers',
      viewAllTo: '/inventory/store-ledger',
      viewAllLabel: 'Full Store Ledger',
      filters: [
        { key: 'ALL', label: 'All' },
        { key: 'IN', label: 'Stock In' },
        { key: 'OUT', label: 'Issued' },
        { key: 'PAYMENT', label: 'Vouchers' }
      ],
      emptyTitle: 'No store movements or vouchers recorded yet',
      emptySubtitle: 'Use Stock In, Stock Out, or Store Payments to track your records live.',
      items: activityItems
    },
    watchlistPanel: {
      title: 'Due Accounts & Low Stock Watch',
      subtitle: 'Receivables, Vendor Payables & Low Stock parts',
      viewAllTo: '/inventory/store-payments',
      viewAllLabel: 'Store Payments',
      emptyTitle: 'All accounts clear & store items well stocked!',
      emptySubtitle: 'No pending balances or low stock alerts right now.',
      items: watchlistItems
    }
  };
}

function buildMachineDashboardConfig({
  theme,
  machineSales = [],
  machineRepairs = [],
  machineModels = [],
  machineCustomers = [],
  customerPayments = []
}) {
  const ledgers = buildCustomerLedgers({ machineCustomers, machineSales, machineRepairs, customerPayments });
  const metrics = buildBillingSummaryMetrics({
    ledgers,
    sales: machineSales,
    repairs: machineRepairs,
    payments: customerPayments,
    resolveSale: resolveSaleFinancials,
    resolveRepair: resolveRepairFinancials
  });
  const chartSeries = buildBillingTimeSeries({
    sales: machineSales,
    repairs: machineRepairs,
    payments: customerPayments,
    resolveSale: resolveSaleFinancials,
    resolveRepair: resolveRepairFinancials
  });

  const inWorkshopCount = machineRepairs.filter((r) => r.repairStatus === 'Received' || r.repairStatus === 'In Repair').length;
  const readyRepairsCount = machineRepairs.filter((r) => r.repairStatus === 'Ready for Delivery').length;

  const modelCounts = {};
  machineSales.forEach((sale) => {
    if (Array.isArray(sale.items) && sale.items.length > 0) {
      sale.items.forEach((it) => {
        const label = it.machineName || it.name || 'Standard Machine';
        modelCounts[label] = (modelCounts[label] || 0) + (parseInt(it.qty, 10) || 1);
      });
    } else {
      const label = sale.machineName || 'Standard Machine';
      modelCounts[label] = (modelCounts[label] || 0) + (parseInt(sale.qty, 10) || 1);
    }
  });
  const topModels = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const maxQty = Math.max(...topModels.map((m) => m[1]), 1);
  const totalRepairs = Math.max(machineRepairs.length, 1);

  const breakdownItems = [
    ...(machineRepairs.length > 0
      ? [
          {
            label: 'Workshop Active (Received / In Repair)',
            valueText: `${inWorkshopCount} jobs`,
            percent: Math.round((inWorkshopCount / totalRepairs) * 100),
            tone: inWorkshopCount > 0 ? 'warning' : 'neutral'
          },
          {
            label: 'Ready for Customer Delivery',
            valueText: `${readyRepairsCount} ready`,
            percent: Math.round((readyRepairsCount / totalRepairs) * 100),
            tone: 'success'
          }
        ]
      : []),
    ...topModels.map(([name, qty], idx) => ({
      label: name,
      valueText: `${qty} unit${qty === 1 ? '' : 's'} sold`,
      percent: Math.round((qty / maxQty) * 100),
      tone: idx === 0 ? 'primary' : 'neutral'
    }))
  ].slice(0, 5);

  const activityItems = [
    ...machineSales.map((sale) => {
      const fin = resolveSaleFinancials(sale, customerPayments);
      return {
        id: `sale-${sale.id}`,
        filterKey: 'SALE',
        sortTime: new Date(sale.dateISO || 0).getTime() || 0,
        icon: <ShoppingCartOutlined />,
        tone: fin.balanceAmount <= 0 ? 'success' : 'primary',
        title: sale.customerName || 'Customer',
        badge: fin.paymentStatus,
        badgeColor: fin.paymentStatus === 'Paid' ? 'success' : fin.paymentStatus === 'Partial' ? 'warning' : 'error',
        subtitle: `${formatItemsSummaryLabel(sale.items, sale.machineName || 'Lawn Mower')} • ${formatFriendlyDateTime(sale)}`,
        rightPrimary: formatPKR(fin.billTotal),
        rightSecondary: fin.balanceAmount > 0 ? `Due: ${formatPKR(fin.balanceAmount)}` : 'Paid in Full',
        to: '/inventory/machine-invoices'
      };
    }),
    ...machineRepairs.map((repair) => {
      const fin = resolveRepairFinancials(repair, customerPayments);
      const st = repair.repairStatus || 'Received';
      return {
        id: `rep-${repair.id}`,
        filterKey: 'REPAIR',
        sortTime: new Date(repair.dateISO || repair.receivedDate || 0).getTime() || 0,
        icon: <ToolOutlined />,
        tone: st === 'Delivered' || st === 'Ready for Delivery' ? 'success' : 'warning',
        title: `${repair.customerName || 'Walk-in'} (Workshop)`,
        badge: st,
        badgeColor: st === 'Delivered' || st === 'Ready for Delivery' ? 'success' : 'warning',
        subtitle: `${repair.machineName || 'Machine Repair'} • ${repair.receivedDate || formatFriendlyDateTime(repair)}`,
        rightPrimary: formatPKR(fin.netTotal),
        rightSecondary: fin.balanceAmount > 0 ? `Due: ${formatPKR(fin.balanceAmount)}` : 'Settled',
        to: '/inventory/machine-repairs'
      };
    }),
    ...customerPayments.map((pay) => buildVoucherFeedEntry(pay, '/inventory/machine-payments'))
  ].sort((a, b) => b.sortTime - a.sortTime);

  const watchlistItems = [
    ...buildDueWatchlistRows(ledgers, '/inventory/machine-payments', 'No Phone'),
    ...machineRepairs
      .filter((r) => r.repairStatus === 'Ready for Delivery' || r.repairStatus === 'In Repair')
      .slice(0, 3)
      .map((r) => ({
        id: `rep-watch-${r.id}`,
        title: `${r.customerName || 'Customer'} — ${r.machineName || 'Repair'}`,
        subtitle: `Job ${r.repairNo || 'REP'} • ${r.customerPhone || 'No Phone'}`,
        statusText: r.repairStatus,
        chipColor: r.repairStatus === 'Ready for Delivery' ? 'success' : 'warning',
        tone: r.repairStatus === 'Ready for Delivery' ? 'success' : 'warning',
        urgent: false,
        to: '/inventory/machine-repairs'
      }))
  ];

  const noticeParts = [];
  if (readyRepairsCount > 0) noticeParts.push(`${readyRepairsCount} repaired machine(s) ready for delivery`);
  if (metrics.totalReceivables > 0) noticeParts.push(`${formatPKR(metrics.totalReceivables)} pending customer balances`);

  return buildFinancialDeptConfig({
    theme,
    activeDepartment: 'machine-production',
    title: 'Machine Production & Billing',
    subtitle: 'Assembled machine sales, workshop repairing, customer payments & account statements',
    badgeLabel: 'Workshop Live',
    headerIcon: <BuildOutlined />,
    quickActions: [
      { label: 'Payments & Balances', icon: <WalletOutlined />, to: '/inventory/machine-payments', variant: 'outlined' },
      { label: 'Machine Repairs', icon: <ToolOutlined />, to: '/inventory/machine-repairs', variant: 'outlined' },
      { label: 'New Machine Sale', icon: <PlusOutlined />, to: '/inventory/machine-sales', variant: 'contained' }
    ],
    alertBanner:
      noticeParts.length > 0
        ? {
            severity: metrics.totalReceivables > 0 ? 'warning' : 'info',
            message: `Workshop & Billing Notice: ${noticeParts.join(' • ')}.`,
            actionLabel: 'Open Payments & Balances',
            actionTo: '/inventory/machine-payments'
          }
        : null,
    healthyMessage:
      machineSales.length > 0 || machineRepairs.length > 0
        ? 'All machine customer accounts are settled and no repairs are waiting for pickup.'
        : null,
    billingKpi: {
      label: 'Total Machine Billing',
      value: formatPKR(metrics.totalCombinedBilling),
      helper: `${metrics.totalUnitsSold} units (${formatPKR(metrics.totalSalesRevenue)} Sales + ${formatPKR(metrics.totalRepairRevenue)} Repairs)`
    },
    collectedKpiHelper: 'Payments from machine bills, repairs & accounts',
    fourthKpi: {
      label: 'Active Workshop Jobs',
      value: `${inWorkshopCount} Machines`,
      helper: `${readyRepairsCount} ready • ${machineModels.length} machine models`,
      icon: <ToolOutlined />,
      tone: inWorkshopCount > 0 ? 'warning' : 'primary',
      to: '/inventory/machine-repairs'
    },
    metrics,
    chartTitle: 'Machine Billing & Cash Recovery',
    chartSubtitle: 'Total sales & repair billing vs actual payments collected',
    chartSeries,
    emptyChartTitle: 'No machine sales or repairs recorded yet',
    emptyChartSubtitle: 'Record your first machine invoice or repair job card to track cash flow live.',
    overviewTitle: 'Billing & Workshop Health',
    overviewSubtitle: 'Payment recovery rate & active pipeline',
    collectionHelper:
      machineSales.length > 0 || machineRepairs.length > 0
        ? `${metrics.collectionPct}% of billed machine & repair revenue collected`
        : 'Ready for your first machine invoice',
    breakdownTitle: 'Workshop & Top Sold Models',
    emptyBreakdownText: 'Models and repair job breakdowns will appear once sales or repairs are added.',
    breakdownItems,
    activityTitle: 'Recent Machine Activity & Payments',
    activitySubtitle: 'Latest machine sales, workshop repairs & customer vouchers',
    activityFilters: [
      { key: 'ALL', label: 'All' },
      { key: 'SALE', label: 'Sales' },
      { key: 'REPAIR', label: 'Repairs' },
      { key: 'PAYMENT', label: 'Payments' }
    ],
    emptyActivityTitle: 'No machine bills or repair jobs yet',
    emptyActivitySubtitle: 'Create a Machine Sale or Repair slip to track progress live.',
    activityItems,
    watchlistTitle: 'Due Balances & Ready Deliveries',
    watchlistSubtitle: 'Follow-ups requiring collection or handover',
    emptyWatchlistTitle: 'No pending balances or active repairs',
    emptyWatchlistSubtitle: 'All customer accounts are settled.',
    watchlistItems,
    invoicesPath: '/inventory/machine-invoices',
    paymentsPath: '/inventory/machine-payments'
  });
}

function buildShopDashboardConfig({
  theme,
  items = [],
  usageLogs = [],
  totalInventoryCount = 0,
  totalValuation = 0,
  lowStockAlerts = [],
  shopSales = [],
  shopCustomers = [],
  shopCustomerPayments = [],
  todaySalesAmount = 0
}) {
  const ledgers = buildShopCustomerLedgers({ shopCustomers, shopSales, shopCustomerPayments });
  const metrics = buildBillingSummaryMetrics({
    ledgers,
    sales: shopSales,
    payments: shopCustomerPayments,
    resolveSale: resolveShopSaleFinancials
  });
  const chartSeries = buildBillingTimeSeries({
    sales: shopSales,
    payments: shopCustomerPayments,
    resolveSale: resolveShopSaleFinancials
  });

  const todayISO = getTodayISO();
  const collectedToday = (shopCustomerPayments || [])
    .filter(
      (p) =>
        isRecordInDateRange({ createdAt: p.createdAt, dateISO: p.dateISO, time: p.time }, todayISO, todayISO) &&
        p.entryType !== 'Payout' &&
        p.entryType !== 'Adjustment'
    )
    .reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);

  const categoryBreakdown = buildCategoryBreakdown(items, (item) => parseInt(item.totalStock ?? item.remainingStock, 10) || 0);

  const activityItems = [
    ...(shopSales || []).map((rawSale) => {
      const sale = normalizeShopSaleRecord(rawSale);
      const fin = resolveShopSaleFinancials(rawSale, shopCustomerPayments);
      return {
        id: `sale-${sale.id}`,
        filterKey: 'SALE',
        sortTime: new Date(sale.dateISO || 0).getTime() || 0,
        icon: <ShoppingCartOutlined />,
        tone: fin.balanceAmount <= 0 ? 'success' : 'primary',
        title: sale.customerName || 'Walk-in Customer',
        badge: fin.paymentStatus,
        badgeColor: fin.paymentStatus === 'Paid' ? 'success' : fin.paymentStatus === 'Partial' ? 'warning' : 'error',
        subtitle: `${sale.machineName || 'Counter Sale'} • ${formatFriendlyDateTime(sale)}`,
        rightPrimary: formatPKR(fin.billTotal),
        rightSecondary: fin.balanceAmount > 0 ? `Due: ${formatPKR(fin.balanceAmount)}` : 'Paid in Full',
        to: '/shop/invoices'
      };
    }),
    ...(shopCustomerPayments || []).map((pay) => buildVoucherFeedEntry(pay, '/shop/payments')),
    ...(usageLogs || [])
      .filter((log) => String(log.type || '').toUpperCase().includes('IN'))
      .slice(0, 10)
      .map((log) => {
        const qty = Math.abs(parseInt(log.qtyUsed, 10) || 0);
        return {
          id: `stock-${log.id}`,
          filterKey: 'STOCK',
          sortTime: new Date(log.timestamp || log.dateISO || 0).getTime() || 0,
          icon: <ImportOutlined />,
          tone: 'primary',
          title: log.itemName || 'Shop Product',
          badge: 'Stock In',
          badgeColor: 'primary',
          subtitle: `${log.usedBy || 'Supplier'} • +${qty} units • ${formatFriendlyDateTime(log)}`,
          rightPrimary: `+${qty} added`,
          rightSecondary: `${log.remainingStockAfter ?? 0} in stock`,
          to: '/shop/add-product'
        };
      })
  ].sort((a, b) => b.sortTime - a.sortTime);

  const watchlistItems = [
    ...buildDueWatchlistRows(ledgers, '/shop/payments', 'Retail Counter'),
    ...lowStockAlerts.slice(0, 4).map((item) => {
      const stockNum = parseInt(item.totalStock ?? item.remainingStock, 10) || 0;
      return {
        id: `shop-stock-${item.id}`,
        title: item.name || 'Shop Item',
        subtitle: `${formatCategoryLabel(item.category || 'General')} • ${formatPKR(item.unitPrice)}`,
        statusText: `${stockNum} ${item.unit || 'PCS'}`,
        chipColor: 'warning',
        tone: 'warning',
        urgent: true,
        to: '/shop/add-product'
      };
    })
  ];

  const notices = [];
  if (metrics.totalReceivables > 0) notices.push(`${formatPKR(metrics.totalReceivables)} pending customer receivables`);
  if (lowStockAlerts.length > 0) notices.push(`${lowStockAlerts.length} shelf product(s) running low`);

  return buildFinancialDeptConfig({
    theme,
    activeDepartment: 'shop-mart',
    title: 'Retail Shop Mart Dashboard',
    subtitle: 'Retail counter billing, customer payments, due balances & shelf product inventory',
    badgeLabel: 'Counter Live',
    headerIcon: <ShopOutlined />,
    quickActions: [
      { label: 'Payments & Balances', icon: <WalletOutlined />, to: '/shop/payments', variant: 'outlined' },
      { label: 'Add Product', icon: <ImportOutlined />, to: '/shop/add-product', variant: 'outlined' },
      { label: 'Open Shop Mart (POS)', icon: <PlusOutlined />, to: '/shop/mart', variant: 'contained' }
    ],
    alertBanner:
      notices.length > 0
        ? {
            severity: 'warning',
            message: `Counter & Shelf Notice: ${notices.join(' • ')}.`,
            actionLabel: metrics.totalReceivables > 0 ? 'Open Payments & Balances' : 'Restock Shelf',
            actionTo: metrics.totalReceivables > 0 ? '/shop/payments' : '/shop/add-product'
          }
        : null,
    healthyMessage: items.length > 0 ? `Shop counter has ${items.length} products stocked and customer accounts are balanced.` : null,
    billingKpi: {
      label: 'Total Shop Billing',
      value: formatPKR(metrics.totalCombinedBilling),
      helper: `Today: ${formatPKR(todaySalesAmount)} • ${metrics.totalUnitsSold} units billed`
    },
    collectedKpiHelper: `Today: ${formatPKR(collectedToday)} received at counter`,
    fourthKpi: {
      label: 'Shop Shelf Inventory',
      value: `${totalInventoryCount.toLocaleString()} Units`,
      helper: `Worth ${formatPKR(totalValuation)} • ${items.length} products`,
      icon: <InboxOutlined />,
      tone: lowStockAlerts.length > 0 ? 'warning' : 'primary',
      to: '/shop/add-product'
    },
    metrics,
    chartTitle: 'Shop Billing & Cash Recovery',
    chartSubtitle: 'Total counter invoices vs actual cash & voucher collections',
    chartSeries,
    emptyChartTitle: 'No shop sales or payment collections yet',
    emptyChartSubtitle: 'Record your first counter sale or payment receipt to see your cash flow chart.',
    overviewTitle: 'Billing & Shelf Health',
    overviewSubtitle: 'Payment collection rate & top categories',
    collectionHelper:
      shopSales.length > 0 ? `${metrics.collectionPct}% of billed retail sales recovered` : `${items.length} shelf products ready for billing`,
    breakdownTitle: 'Top Shop Categories',
    emptyBreakdownText: 'Add retail products to see category distribution.',
    breakdownItems: categoryBreakdown,
    activityTitle: 'Recent Shop Sales & Payments',
    activitySubtitle: 'Latest counter bills, vouchers & inward shelf stock',
    activityFilters: [
      { key: 'ALL', label: 'All' },
      { key: 'SALE', label: 'Sales' },
      { key: 'PAYMENT', label: 'Payments' },
      { key: 'STOCK', label: 'Stock In' }
    ],
    emptyActivityTitle: 'No shop sales or vouchers recorded yet',
    emptyActivitySubtitle: 'Open Shop Mart above to issue your first bill.',
    activityItems,
    watchlistTitle: 'Due Balances & Low Stock',
    watchlistSubtitle: 'Customers owing payment & items needing restock',
    emptyWatchlistTitle: 'All accounts clear & shelf stocked!',
    emptyWatchlistSubtitle: 'No pending customer balances or low shelf products right now.',
    watchlistItems,
    invoicesPath: '/shop/invoices',
    paymentsPath: '/shop/payments'
  });
}

/**
 * Shared reusable Department Dashboard container powering Factory Store, Machine Production,
 * and Retail Shop Mart so all three departments run from one consistent component without
 * duplicated page-level state, hooks, or hardcoded layout markup.
 */
export default function DepartmentDashboard({ department }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasAccessToItem } = usePermission();

  const store = useStoreInventory();

  useEffect(() => {
    if (department === 'factory-store' && !hasAccessToItem({ id: 'dashboard' })) {
      navigate('/inventory/stock-out', { replace: true });
    }
  }, [department, hasAccessToItem, navigate]);

  const dashboardProps = useMemo(() => {
    if (department === 'factory-store') {
      return buildFactoryStoreConfig({ theme, ...store });
    }
    if (department === 'machine-production') {
      return buildMachineDashboardConfig({ theme, ...store });
    }
    return buildShopDashboardConfig({ theme, ...store });
  }, [department, theme, store]);

  return <MasterDashboard key={dashboardProps.activeDepartment} {...dashboardProps} />;
}

DepartmentDashboard.propTypes = {
  department: PropTypes.oneOf(['factory-store', 'machine-production', 'shop-mart']).isRequired
};
