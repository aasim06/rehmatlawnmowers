import { useMemo } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';
import usePermission from 'hooks/usePermission';
import PaymentsWorkspace from 'sections/ledger/PaymentsWorkspace';
import { buildFactoryStoreLedgers, buildUnifiedStoreCashbook, getStorePartyDirectorySuggestions } from 'utils/storeLedgerHelpers';

/**
 * Factory Store Payments & Balances workspace backed by PaymentsWorkspace.
 */
export default function StorePaymentsPage() {
  const { canDelete } = usePermission();

  const {
    vendors = [],
    storeCustomers = [],
    usageLogs = [],
    storePayments = [],
    vendorPayments = [],
    addStorePayment,
    deleteStorePayment
  } = useStoreInventory();

  const unifiedPayments = useMemo(() => buildUnifiedStoreCashbook({ storePayments, vendorPayments }), [storePayments, vendorPayments]);

  const partyLedgers = useMemo(
    () =>
      buildFactoryStoreLedgers({
        storeCustomers,
        vendors,
        usageLogs,
        storePayments,
        vendorPayments
      }),
    [storeCustomers, vendors, usageLogs, storePayments, vendorPayments]
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

  return (
    <PaymentsWorkspace
      mode="store"
      title="Store Payments"
      subtitle="Collect pending store bills, settle payable balances, and review today's receipts & payouts."
      ledgerPath="/inventory/store-ledger"
      ledgerButtonLabel="Store Party Ledger"
      statementTitle="Official Store Account Statement"
      customerLedgers={partyLedgers}
      customerDirectory={partyDirectory}
      customerPayments={unifiedPayments}
      canDelete={canDelete}
      onAddPayment={addStorePayment}
      onDeletePayment={deleteStorePayment}
    />
  );
}
