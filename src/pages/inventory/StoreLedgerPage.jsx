import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HistoryOutlined from '@ant-design/icons/HistoryOutlined';

import { AppButton } from 'components/common';
import { useStoreInventory } from 'context/StoreInventoryContext';
import usePermission from 'hooks/usePermission';
import CustomerLedgerWorkspace from 'sections/ledger/CustomerLedgerWorkspace';
import {
  buildFactoryStoreLedgers,
  buildUnifiedStoreCashbook,
  getStorePartyDirectorySuggestions
} from 'utils/storeLedgerHelpers';

/**
 * Factory Store Complete A-to-Z Party Khata (Customers, Staff & Vendors Lena-Dena Ledger)
 * backed by the shared CustomerLedgerWorkspace.
 */
export default function StoreLedgerPage() {
  const navigate = useNavigate();
  const { canDelete } = usePermission();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const {
    items = [],
    vendors = [],
    storeCustomers = [],
    usageLogs = [],
    storePayments = [],
    vendorPayments = [],
    addStoreCustomer,
    updateStoreCustomer,
    deleteStoreCustomer,
    addStorePayment,
    deleteStorePayment,
    deleteLog,
    deleteMultipleLogs
  } = useStoreInventory();

  const unifiedVouchers = useMemo(
    () => buildUnifiedStoreCashbook({ storePayments, vendorPayments }),
    [storePayments, vendorPayments]
  );

  const partyLedgers = useMemo(
    () =>
      buildFactoryStoreLedgers({
        storeCustomers,
        vendors,
        usageLogs,
        storePayments,
        vendorPayments,
        startDate,
        endDate
      }),
    [storeCustomers, vendors, usageLogs, storePayments, vendorPayments, startDate, endDate]
  );

  const partyDirectory = useMemo(
    () =>
      getStorePartyDirectorySuggestions({
        storeCustomers,
        vendors,
        usageLogs,
        storePayments,
        vendorPayments
      }),
    [storeCustomers, vendors, usageLogs, storePayments, vendorPayments]
  );

  const itemOptions = useMemo(() => (items || []).map((it) => it.name).filter(Boolean), [items]);

  return (
    <CustomerLedgerWorkspace
      mode="store"
      headerTitle="Factory Store Party Ledger"
      subtitle="One-click complete Factory Store accounting: who owes you, whom to pay (vendors & credits), cash vouchers & itemized statements."
      paymentsPath="/inventory/store-payments"
      paymentsButtonLabel="Store Payments & Cashbook"
      accountsHelper="Vendors, buyers, contractors & registered parties"
      debitHelper="Stock Out bills, vendor payments & opening receivables"
      billsLabel="Bills"
      defaultCityLabel="Factory Store"
      documentsTabLabel="Stock In & Stock Out Bills"
      itemsColumnLabel="Store Items"
      saleTypeLabel="Stock Out"
      itemFieldLabel="Store Item"
      emptyAccountsHint='Click "Register Party" above or record Stock In / Stock Out entries to build the Factory Store ledger.'
      statementTitle="Official Factory Store Account Statement"
      saleInvoiceTitle="Official Factory Store Stock Out Receipt"
      purchaseInvoiceTitle="Official Factory Store Vendor Receiving Bill"
      extraHeaderActions={
        <AppButton intent="secondary" startIcon={<HistoryOutlined />} onClick={() => navigate('/inventory/ledger')}>
          Item Bin Card
        </AppButton>
      }
      customerLedgers={partyLedgers}
      customerDirectory={partyDirectory}
      customerPayments={unifiedVouchers}
      itemOptions={itemOptions}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      canDelete={canDelete}
      onAddCustomer={addStoreCustomer}
      onUpdateCustomer={updateStoreCustomer}
      onDeleteCustomer={deleteStoreCustomer}
      onAddPayment={addStorePayment}
      onDeletePayment={deleteStorePayment}
      onDeleteSale={deleteLog}
      onDeleteMultipleSales={deleteMultipleLogs}
    />
  );
}
