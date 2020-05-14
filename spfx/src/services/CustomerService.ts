import { BaseComponentContext } from "@microsoft/sp-component-base";
import { AadHttpClient } from "@microsoft/sp-http";
import { Customer } from "../models/Customer";

export class CustomerService {
  private _context: BaseComponentContext;
  private _apiBaseUrl: string;
  private _aadClient: AadHttpClient;

  get ApiBaseUrl(): string { return this._apiBaseUrl; }

  constructor(context: BaseComponentContext, apiBaseUrl: string) {
    this._context = context;
    this._apiBaseUrl = apiBaseUrl;
  }

  private _getAadClient = async (): Promise<AadHttpClient> => {
    if (!this._aadClient) {
      this._aadClient = await this._context.aadHttpClientFactory.getClient(this._apiBaseUrl);
    }
    return this._aadClient;
  }

  public getCustomers = async (): Promise<Customer[]> => {
    const aadClient = await this._getAadClient();
    const response = await aadClient.get(`${this._apiBaseUrl}/customers`, AadHttpClient.configurations.v1);

    if (!response.ok) throw new Error(`[${response.status}] ${response.statusText}`);

    const data = await response.json();
    return data;
  }

  public addCustomer = async (newCustomer: Customer): Promise<void> => {
    const aadClient = await this._getAadClient();
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const response = await aadClient.fetch(`${this._apiBaseUrl}/customer`, AadHttpClient.configurations.v1, {
      method: 'PUT',
      body: JSON.stringify(newCustomer),
      headers
    });

    if (!response.ok) throw new Error(`[${response.status}] ${response.statusText}`);
  }

  public updateCustomer = async (existingCustomer: Customer): Promise<void> => {
    const aadClient = await this._getAadClient();
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const response = await aadClient.fetch(`${this._apiBaseUrl}/customer/${existingCustomer.CustomerID}`, AadHttpClient.configurations.v1, {
      method: 'PATCH',
      body: JSON.stringify(existingCustomer),
      headers
    });

    if (!response.ok) throw new Error(`[${response.status}] ${response.statusText}`);
  }

  public deleteCustomer = async (customerID: number): Promise<void> => {
    const aadClient = await this._getAadClient();
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const response = await aadClient.fetch(`${this._apiBaseUrl}/customer/${customerID}`, AadHttpClient.configurations.v1, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) throw new Error(`[${response.status}] ${response.statusText}`);
  }

  public getCustomer = async (customerID: number): Promise<Customer> => {
    const aadClient = await this._getAadClient();
    const response = await aadClient.get(`${this._apiBaseUrl}/customer/${customerID}`, AadHttpClient.configurations.v1);

    if (!response.ok) throw new Error(`[${response.status}] ${response.statusText}`);

    const data = await response.json();
    return data;
  }
}

    // const aadTokenProvider = await this._context.aadTokenProviderFactory.getTokenProvider();
    // const aadToken = await aadTokenProvider.getToken(this._apiBaseUrl);
    // const headers: Headers = new Headers();
    // headers.set('Authorization', `Bearer ${aadToken}`);
    // const response = await this._context.httpClient.get(`${this._apiBaseUrl}/customers`, AadHttpClient.configurations.v1, { headers });
