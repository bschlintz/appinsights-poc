import * as React from 'react';
import { useState, useEffect } from 'react';
import styles from './CustomerManager.module.scss';
import { ICustomerManagerProps } from './ICustomerManagerProps';
import useCustomerData from '../../../hooks/useCustomerData';
import { CustomerService } from '../../../services/CustomerService';
import { Customer } from '../../../models/Customer';
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import { ShimmeredDetailsList } from 'office-ui-fabric-react/lib/ShimmeredDetailsList';
import { IColumn } from 'office-ui-fabric-react/lib/components/DetailsList/DetailsList.types';
import { Selection } from 'office-ui-fabric-react/lib/Selection';
import { Panel } from 'office-ui-fabric-react/lib/Panel';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { TextField, MaskedTextField } from 'office-ui-fabric-react/lib/TextField';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { ChaosService } from '../../../services/ChaosService';

let customerService: CustomerService = null;
let chaosService: ChaosService = null;
let selection: Selection = null;

const columns: IColumn[] = [
  { key: 'CustomerID', fieldName: 'CustomerID', name: 'Customer ID', minWidth: 10, isResizable: true },
  { key: 'CustomerName', fieldName: 'CustomerName', name: 'Customer Name', minWidth: 200, isResizable: true },
  { key: 'PhoneNumber', fieldName: 'PhoneNumber', name: 'Phone', minWidth: 100, isResizable: true },
  { key: 'WebsiteURL', name: 'Website', minWidth: 250, onRender: (item: Customer) => <a href={item.WebsiteURL} target="_blank" data-interception="off">{item.WebsiteURL}</a>, isResizable: true },
  { key: 'AddressLine1', name: 'Address Line 1', minWidth: 100, onRender: (item: Customer) => item.Delivery.AddressLine1, isResizable: true },
  { key: 'AddressLine2', name: 'Address Line 2', minWidth: 200, onRender: (item: Customer) => item.Delivery.AddressLine2, isResizable: true },
  { key: 'PostalCode', name: 'Zip Code', minWidth: 50, onRender: (item: Customer) => item.Delivery.PostalCode, isResizable: true },
];

const defaultNewCustomer: Customer = {
  CustomerName: '',
  FaxNumber: '',
  PhoneNumber: '',
  WebsiteURL: '',
  Delivery: { AddressLine1: '', AddressLine2: '', PostalCode: '' }
};

const CustomerManager: React.FC<ICustomerManagerProps> = ({ context, apiBaseUrl, appInsights }) => {
  customerService = customerService || new CustomerService(context, apiBaseUrl);
  chaosService = chaosService || new ChaosService(context, customerService);
  const { isLoading, customers, hasError, error, reloadData } = useCustomerData(customerService);
  const [ selectedCount, setSelectedCount ] = useState<number>(0);
  const [ showNewItemPanel, setShowItemPanel ] = useState<boolean>(false);
  const [ showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [ isDeleting, setIsDeleting ] = useState<boolean>(false);
  const [ activeCustomer, setActiveCustomer ] = useState<Customer>(defaultNewCustomer);
  selection = selection || new Selection({
    onSelectionChanged: () => setSelectedCount(selection.getSelectedCount())
  });

  useEffect(() => {
    if (error) {
      appInsights.trackException({ exception: error, properties: {
        customerIds: activeCustomer.CustomerID ? [ activeCustomer.CustomerID ] : []
      }});
    }
  }, [error]);

  const trackEvent = (event: 'add' | 'edit' | 'delete', customerIds: number[]) => {
    appInsights.trackEvent({name: `SPFX: ${event} customer`, properties: {
      customerIds: customerIds.filter(n => n), // remove nulls
    }});
  };

  const onDismissAddEditPanel = () => {
    setShowItemPanel(false);
    setActiveCustomer(defaultNewCustomer);
  };

  const onDismissDeleteConfirmDialog = () => {
    setShowDeleteConfirm(false);
    setIsDeleting(false);
  };

  const onSave = async () => {
    if (typeof(activeCustomer.CustomerID) !== "undefined") {
      await customerService.updateCustomer(activeCustomer);
      trackEvent('edit', [activeCustomer.CustomerID]);
    }
    else {
      trackEvent('add', [activeCustomer.CustomerID]);
      await customerService.addCustomer(activeCustomer);
    }

    onDismissAddEditPanel();

    reloadData();
  };

  const onDelete = async () => {
    setIsDeleting(true);

    const selectedItems = customers.filter((c, idx) => selection.isIndexSelected(idx));

    trackEvent('delete', selectedItems.map(i => i.CustomerID));
    await Promise.all(selectedItems.map(customer => customerService.deleteCustomer(customer.CustomerID)));

    onDismissDeleteConfirmDialog();

    reloadData();
  };

  const commandBarItems: ICommandBarItemProps[] = [
    { key: 'newItem', text: 'New', iconProps: { iconName: 'Add' }, onClick: () => setShowItemPanel(true) },
    { key: 'editItem', text: 'Edit', iconProps: { iconName: 'Edit' }, disabled: selectedCount !== 1,
      onClick: () => {
        const selectedCustomer = customers[selection.getSelectedIndices()[0]];
        setActiveCustomer(selectedCustomer);
        setShowItemPanel(true);
      }
    },
    { key: 'deleteItem', text: 'Delete', iconProps: { iconName: 'Delete' }, disabled: selectedCount === 0, onClick: () => setShowDeleteConfirm(true) },
  ];

  const farCommandBarItems: ICommandBarItemProps[] = [
    { key: 'chaos', text: 'Chaos', iconProps: { iconName: 'Warning12'}, subMenuProps: {
      items: [
        { key: '404', text: 'API Error: Get Invalid Customer', onClick: () => { chaosService.getInvalidCustomer(); }, iconProps: { iconName: 'Bug' }},
        { key: '500', text: 'API Error: Delete Invalid Customer', onClick: () => { chaosService.deleteInvalidCustomer(); }, iconProps: { iconName: 'Bug' }},
        { key: 'dupeName', text: 'SQL Error: Duplicate Name', onClick: () => { chaosService.invokeApiExceptionDupeName(); }, iconProps: { iconName: 'Bug' }},
        { key: 'undefined', text: 'Client-side Runtime Error', iconProps: { iconName: 'Bug' }, onClick: () => {
          try {
            chaosService.invokeRuntimeError();
          }
          catch (error) {
            appInsights.trackException({ exception: error });
            console.error(error);
          }
        }},
      ]
    }}
  ];

  const renderCustomers = () => (
    <>
      <CommandBar
        items={commandBarItems}
        farItems={farCommandBarItems}
        ariaLabel="Use left and right arrow keys to navigate between commands"
      />
      <ShimmeredDetailsList
        enableShimmer={isLoading}
        columns={columns}
        items={customers}
        selection={selection}
        getKey={(item: Customer, index: number) => `${index}${item ? `_${item.CustomerID}` : ''}`}
      />
    </>
  );

  const renderError = () => (
    <div>
      <strong>An error has occurred.</strong>
      <div>{error.message}</div>
    </div>
  );

  return (
    <div className={ styles.container }>
      <h2>Customer Manager</h2>
      {!hasError
        ? renderCustomers()
        : renderError()
      }
      <Panel
        isOpen={showNewItemPanel}
        onDismiss={onDismissAddEditPanel}
        onRenderFooterContent={() => <Stack tokens={{childrenGap: 10}} horizontal>
          <PrimaryButton onClick={onSave}>Save</PrimaryButton>
          <DefaultButton onClick={onDismissAddEditPanel}>Cancel</DefaultButton>
        </Stack>}
        isFooterAtBottom={true}
        headerText="New Customer"
      >
        <Stack tokens={{childrenGap: 10}}>
          <TextField label="Customer Name" required
            onChange={(ev, val) => setActiveCustomer({...activeCustomer, CustomerName: val})}
            value={activeCustomer.CustomerName}
          />
          <MaskedTextField label="Phone Number" mask="(999) 999-9999" required
            onChange={(ev, val) => setActiveCustomer({...activeCustomer, PhoneNumber: val})}
            value={activeCustomer.PhoneNumber}
          />
          <TextField label="Website" required
            onChange={(ev, val) => setActiveCustomer({...activeCustomer, WebsiteURL: val})}
            value={activeCustomer.WebsiteURL}
          />
          <TextField label="Address Line 1" required
            onChange={(ev, val) => setActiveCustomer({...activeCustomer, Delivery: { ...activeCustomer.Delivery, AddressLine1: val }})}
            value={activeCustomer.Delivery.AddressLine1}
          />
          <TextField label="Address Line 2" required
            onChange={(ev, val) => setActiveCustomer({...activeCustomer, Delivery: { ...activeCustomer.Delivery, AddressLine2: val }})}
            value={activeCustomer.Delivery.AddressLine2}
          />
          <TextField label="Zip Code" required
            onChange={(ev, val) => setActiveCustomer({...activeCustomer, Delivery: { ...activeCustomer.Delivery, PostalCode: val }})}
            value={activeCustomer.Delivery.PostalCode}
          />
        </Stack>
      </Panel>
      <Dialog
        hidden={!showDeleteConfirm}
        onDismiss={!isDeleting ? onDismissDeleteConfirmDialog : null}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Confirmation',
          closeButtonAriaLabel: 'Close',
          subText: 'Are you sure you want to delete these customer(s)?',
        }}
        modalProps={{
          isBlocking: false,
        }}
      >
        <DialogFooter>
          <Stack tokens={{childrenGap: 10}} horizontal horizontalAlign='end'>
            <PrimaryButton onClick={onDelete} disabled={isDeleting}>Delete</PrimaryButton>
            <DefaultButton onClick={onDismissDeleteConfirmDialog} disabled={isDeleting}>Cancel</DefaultButton>
          </Stack>
        </DialogFooter>
      </Dialog>

    </div>
  );
};


export default CustomerManager;
