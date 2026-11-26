import { useMemo } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';
import usePermission from 'hooks/usePermission';
import PaymentsWorkspace from 'sections/ledger/PaymentsWorkspace';
import { buildCustomerLedgers, getCustomerDirectorySuggestions } from 'utils/machineLedgerHelpers';

/**
 * Machine Production Payments & Balances workspace.
 */
export default function MachinePaymentsPage() {
  const { canDelete } = usePermission();
  const {
    machineSales = [],
    machineRepairs = [],
    machineCustomers = [],
    customerPayments = [],
    addCustomerPayment,
    deleteCustomerPayment
  } = useStoreInventory();

  const customerLedgers = useMemo(
    () => buildCustomerLedgers({ machineCustomers, machineSales, machineRepairs, customerPayments }),
    [machineCustomers, machineSales, machineRepairs, customerPayments]
  );

  const customerDirectory = useMemo(
    () => getCustomerDirectorySuggestions({ machineCustomers, machineSales, machineRepairs, customerPayments }),
    [machineCustomers, machineSales, machineRepairs, customerPayments]
  );

  return (
    <PaymentsWorkspace
      title="Payments & Balances"
      subtitle="Track who owes money to collect, advance credits to refund, and today's cash receipts & payouts."
      ledgerPath="/inventory/customer-ledgers"
      ledgerButtonLabel="Full Customer Ledgers"
      statementTitle="Official Customer Account Statement"
      customerLedgers={customerLedgers}
      customerDirectory={customerDirectory}
      customerPayments={customerPayments}
      canDelete={canDelete}
      onAddPayment={addCustomerPayment}
      onDeletePayment={deleteCustomerPayment}
    />
  );
}
