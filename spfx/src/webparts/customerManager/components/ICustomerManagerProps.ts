import { BaseComponentContext } from "@microsoft/sp-component-base";
import { ApplicationInsights } from "@microsoft/applicationinsights-web";

export interface ICustomerManagerProps {
  context: BaseComponentContext;
  apiBaseUrl: string;
  appInsights: ApplicationInsights;
}
