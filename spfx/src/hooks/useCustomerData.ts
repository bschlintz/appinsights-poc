import useAsyncData from "./useAsyncData";
import { CustomerService } from "../services/CustomerService";
import { Customer } from "../models/Customer";
import { useState } from "react";

export type CustomerData = {
  isLoading: boolean;
  customers: Customer[];
  hasError: boolean;
  error?: Error;
  reloadData: () => void;
};

export const useCustomerData = (service: CustomerService): CustomerData => {
  const [ loadCount, setLoadCount ] = useState<number>(0);
  const { isLoading, data, error } = useAsyncData<Customer[]>([], service.getCustomers, [loadCount]);
  return { isLoading, customers: data, hasError: !!error, error, reloadData: () => setLoadCount(loadCount + 1) };
};

export default useCustomerData;
