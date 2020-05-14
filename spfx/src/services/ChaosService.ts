import { BaseComponentContext } from "@microsoft/sp-component-base";
import { CustomerService } from "./CustomerService";
import { Customer } from "../models/Customer";

export class ChaosService {
  private _context: BaseComponentContext;
  private _customerService: CustomerService;

  constructor(context: BaseComponentContext, customerService: CustomerService) {
    this._context = context;
    this._customerService = customerService;
  }

  public getInvalidCustomer = async (): Promise<Customer> => {
    return this._customerService.getCustomer(99999999);
  }

  public deleteInvalidCustomer = async (): Promise<void> => {
    return this._customerService.deleteCustomer(99999999);
  }

  public invokeApiExceptionDupeName = async (): Promise<void> => {
    await this._customerService.addCustomer({
      CustomerName: "Tailspin Toys (Head Office)",
      PhoneNumber: "(308) 555-0100",
      FaxNumber: "(308) 555-0101",
      WebsiteURL: "http://www.tailspintoys.com",
      Delivery: {
        AddressLine1: "Shop 38",
        AddressLine2: "1877 Mittal Road",
        PostalCode: "90419"
      }
    });
  }

  public invokeRuntimeError = () => {
    let undefinedObject;
    undefinedObject.thisWontWork();
  }
}
