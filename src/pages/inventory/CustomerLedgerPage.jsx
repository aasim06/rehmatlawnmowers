import { useMemo, useState } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';
import usePermission from 'hooks/usePermission';
import CustomerLedgerWorkspace from 'sections/ledger/CustomerLedgerWorkspace';
import { buildCustomerLedgers, getCustomerDirectorySuggestions } from 'utils/machineLedgerHelpers';

/**
 * Machine Production Customer Ledgers page backed by the shared CustomerLedgerWorkspace.
 */
export default function CustomerLedgerPage() {
  const { canDelete } = usePermission();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const {
    machineSales = [],
    machineRepairs = [],
    machineModels = [],
    machineCustomers = [],
    customerPayments = [],
    addMachineCustomer,
    updateMachineCustomer,
    deleteMachineCustomer,
    addCustomerPayment,
    deleteCustomerPayment,
    updateMachineSale,
    deleteMachineSale,
    deleteMachineRepair
  } = useStoreInventory();

  const customerLedgers = useMemo(
    () =>
      buildCustomerLedgers({
        machineCustomers,
        machineSales,
        machineRepairs,
        customerPayments,
        startDate,
        endDate
      }),
    [machineCustomers, machineSales, machineRepairs, customerPayments, startDate, endDate]
  );

  const customerDirectory = useMemo(
    () => getCustomerDirectorySuggestions({ machineCustomers, machineSales, machineRepairs, customerPayments }),
    [machineCustomers, machineSales, machineRepairs, customerPayments]
  );

  return (
    <CustomerLedgerWorkspace
      mode="machine"
      headerTitle="Account Statements & History"
      subtitle="Complete chronological debit/credit history, linked machine bills & repairs, and printable customer statements."
      paymentsPath="/inventory/machine-payments"
      paymentsButtonLabel="Payments & Balances"
      accountsHelper="Buyers, repair clients & registered parties"
      debitHelper="Sales bills, repairs, opening & payouts"
      billsLabel="Bills/Jobs"
      defaultCityLabel="Lahore"
      documentsTabLabel="Invoices & Repair Jobs"
      itemsColumnLabel="Machine / Items"
      saleTypeLabel="Machine Sale"
      itemFieldLabel="Machine Model"
      emptyAccountsHint='Click "Register Customer" above or create a Machine Sale / Repair job card to build accounts.'
      statementTitle="Official Customer Account Statement"
      saleInvoiceTitle="Official Customer Machine Sale Invoice"
      repairPath="/inventory/machine-repairs"
      customerLedgers={customerLedgers}
      customerDirectory={customerDirectory}
      customerPayments={customerPayments}
      itemOptions={machineModels}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      canDelete={canDelete}
      onAddCustomer={addMachineCustomer}
      onUpdateCustomer={updateMachineCustomer}
      onDeleteCustomer={deleteMachineCustomer}
      onAddPayment={addCustomerPayment}
      onDeletePayment={deleteCustomerPayment}
      onUpdateSale={updateMachineSale}
      onDeleteSale={deleteMachineSale}
      onDeleteRepair={deleteMachineRepair}
    />
  );
}
