import { useMemo, useState } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';
import usePermission from 'hooks/usePermission';
import CustomerLedgerWorkspace from 'sections/ledger/CustomerLedgerWorkspace';
import { buildShopCustomerLedgers, getShopCustomerDirectorySuggestions } from 'utils/shopHelpers';

/**
 * Retail Shop Mart Customer Ledger page backed by the shared CustomerLedgerWorkspace.
 */
export default function ShopLedgerPage() {
  const { canDelete } = usePermission();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const {
    items = [],
    shopSales = [],
    shopCustomers = [],
    shopCustomerPayments = [],
    vendors = [],
    addShopCustomer,
    updateShopCustomer,
    deleteShopCustomer,
    addShopCustomerPayment,
    deleteShopCustomerPayment,
    updateShopSale,
    deleteShopSale,
    deleteMultipleShopSales
  } = useStoreInventory();

  const customerLedgers = useMemo(
    () =>
      buildShopCustomerLedgers({
        shopCustomers,
        shopSales,
        shopCustomerPayments,
        startDate,
        endDate
      }),
    [shopCustomers, shopSales, shopCustomerPayments, startDate, endDate]
  );

  const customerDirectory = useMemo(
    () =>
      getShopCustomerDirectorySuggestions({
        shopCustomers,
        shopSales,
        shopCustomerPayments,
        vendors
      }),
    [shopCustomers, shopSales, shopCustomerPayments, vendors]
  );

  const itemOptions = useMemo(() => (items || []).map((it) => it.name).filter(Boolean), [items]);

  return (
    <CustomerLedgerWorkspace
      mode="shop"
      headerTitle="Account Statements & History"
      subtitle="Complete chronological debit/credit history, linked retail invoices, and printable customer statements."
      paymentsPath="/shop/payments"
      paymentsButtonLabel="Payments & Balances"
      accountsHelper="Counter buyers & registered parties"
      debitHelper="Retail bills, opening & payouts"
      billsLabel="Bills"
      defaultCityLabel="Retail Counter"
      documentsTabLabel="Shop Sales Invoices"
      itemsColumnLabel="Shop Items"
      saleTypeLabel="Shop Sale"
      itemFieldLabel="Shop Product / Item"
      emptyAccountsHint='Click "Register Customer" above or create a Shop Mart sale to build accounts.'
      statementTitle="Official Shop Customer Account Statement"
      saleInvoiceTitle="Official Shop Sales Invoice"
      customerLedgers={customerLedgers}
      customerDirectory={customerDirectory}
      customerPayments={shopCustomerPayments}
      itemOptions={itemOptions}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      canDelete={canDelete}
      onAddCustomer={addShopCustomer}
      onUpdateCustomer={updateShopCustomer}
      onDeleteCustomer={deleteShopCustomer}
      onAddPayment={addShopCustomerPayment}
      onDeletePayment={deleteShopCustomerPayment}
      onUpdateSale={updateShopSale}
      onDeleteSale={deleteShopSale}
      onDeleteMultipleSales={deleteMultipleShopSales}
    />
  );
}
