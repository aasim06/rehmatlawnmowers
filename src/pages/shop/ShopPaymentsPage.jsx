import { useMemo } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';
import usePermission from 'hooks/usePermission';
import PaymentsWorkspace from 'sections/ledger/PaymentsWorkspace';
import { buildShopCustomerLedgers, getShopCustomerDirectorySuggestions } from 'utils/shopHelpers';

/**
 * Retail Shop Mart Payments & Balances workspace.
 */
export default function ShopPaymentsPage() {
  const { canDelete } = usePermission();
  const {
    shopSales = [],
    shopCustomers = [],
    shopCustomerPayments = [],
    vendors = [],
    addShopCustomerPayment,
    deleteShopCustomerPayment
  } = useStoreInventory();

  const customerLedgers = useMemo(
    () =>
      buildShopCustomerLedgers({
        shopCustomers,
        shopSales,
        shopCustomerPayments
      }),
    [shopCustomers, shopSales, shopCustomerPayments]
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

  return (
    <PaymentsWorkspace
      title="Shop Payments"
      subtitle="Collect pending retail bills, refund customer advance credits, and review today's shop cashbook."
      ledgerPath="/shop/ledger"
      ledgerButtonLabel="Shop Customer Ledger"
      statementTitle="Official Shop Customer Account Statement"
      customerLedgers={customerLedgers}
      customerDirectory={customerDirectory}
      customerPayments={shopCustomerPayments}
      canDelete={canDelete}
      onAddPayment={addShopCustomerPayment}
      onDeletePayment={deleteShopCustomerPayment}
    />
  );
}

