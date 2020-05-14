export type Customer = {
  CustomerID?: number;
  CustomerName: string;
  FaxNumber: string;
  PhoneNumber: string;
  WebsiteURL: string;
  Delivery: {
    AddressLine1: string;
    AddressLine2: string;
    PostalCode: string;
  }
};
