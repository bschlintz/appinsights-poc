import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'CustomerManagerWebPartStrings';
import CustomerManager from './components/CustomerManager';
import { ICustomerManagerProps } from './components/ICustomerManagerProps';

import { ApplicationInsights, DistributedTracingModes, ITelemetryItem } from '@microsoft/applicationinsights-web';
import { parseHref } from '../../utils/urlUtils';
import { GraphService } from '../../services/GraphService';
import { GraphUser } from '../../models/GraphUser';

export interface ICustomerManagerWebPartProps {
  apiBaseUrl: string;
  appInsightsInstrumentationKey: string;
}

export default class CustomerManagerWebPart extends BaseClientSideWebPart <ICustomerManagerWebPartProps> {
  private _appInsights: ApplicationInsights = null;
  private _currentUser: GraphUser = null;

  private _appInsightsInitializer = (telemetryItem: ITelemetryItem): boolean | void => {
    if (telemetryItem) {
      if (telemetryItem.baseType === "RemoteDependencyData" && telemetryItem.baseData && telemetryItem.baseData.target) {
        const isIncluded = telemetryItem.baseData.target.toLowerCase().indexOf(this.properties.apiBaseUrl.trim().toLowerCase()) !== -1;
        if (!isIncluded) return false; // don't track
      }
      if (this._currentUser) {
        telemetryItem.data['user_Department'] = this._currentUser.department || 'Not Set';
        telemetryItem.data['user_DisplayName'] = this._currentUser.displayName || 'Not Set';
        telemetryItem.data['user_JobTitle'] = this._currentUser.jobTitle || 'Not Set';
        telemetryItem.data['user_Mail'] = this._currentUser.mail ? this._currentUser.mail.toLowerCase() : 'Not Set';
        telemetryItem.data['user_UserPrincipalName'] = this._currentUser.userPrincipalName ? this._currentUser.userPrincipalName.toLowerCase() : 'Not Set';
        telemetryItem.data['user_UserType'] = this._currentUser.userType || 'Not Set';
      }
      console.log(`Sending telemetryItem`, telemetryItem);
    }
  }

  public async onInit(): Promise<void> {
    if (this.properties.appInsightsInstrumentationKey) {
      const userId = this.context.pageContext.user.loginName.replace(/([\|:;=])/g, "");
      const apiDomain = parseHref(this.properties.apiBaseUrl).hostname;

      const graphService = new GraphService(this.context);
      this._currentUser = await graphService.getCurrentUser();

      // App Insights JS Documentation: https://github.com/microsoft/applicationinsights-js
      this._appInsights = new ApplicationInsights({
        config: {
          // Instrumentation key that you obtained from the Azure Portal.
          instrumentationKey: this.properties.appInsightsInstrumentationKey,

          // An optional account id, if your app groups users into accounts. No spaces, commas, semicolons, equals, or vertical bars
          accountId: userId,

          // If true, Fetch requests are not autocollected. Default is true
          disableFetchTracking: false,

          // If true, AJAX & Fetch request headers is tracked, default is false.
          enableRequestHeaderTracking: true,

          //If true, AJAX & Fetch request's response headers is tracked, default is false.
          enableResponseHeaderTracking: true,

          // Default false. If true, include response error data text in dependency event on failed AJAX requests.
          enableAjaxErrorStatusText: true,

          // Default false. Flag to enable looking up and including additional browser window.performance timings in the reported ajax (XHR and fetch) reported metrics.
          enableAjaxPerfTracking: true,

          // If true, unhandled promise rejections will be autocollected and reported as a javascript error. When disableExceptionTracking is true (dont track exceptions) the config value will be ignored and unhandled promise rejections will not be reported.
          enableUnhandledPromiseRejectionTracking: true,

          // If true, the SDK will add two headers ('Request-Id' and 'Request-Context') to all CORS requests tocorrelate outgoing AJAX dependencies with corresponding requests on the server side. Default is false
          enableCorsCorrelation: true,

          // Enable correlation headers for specific domains
          correlationHeaderDomains: [ apiDomain ],

          // Sets the distributed tracing mode. If AI_AND_W3C mode or W3C mode is set, W3C trace context headers (traceparent/tracestate) will be generated and included in all outgoing requests. AI_AND_W3C is provided for back-compatibility with any legacy Application Insights instrumented services.
          distributedTracingMode: DistributedTracingModes.AI_AND_W3C,

        }
      });

      this._appInsights.loadAppInsights();
      this._appInsights.addTelemetryInitializer(this._appInsightsInitializer);
      this._appInsights.setAuthenticatedUserContext(userId, userId, true);
      this._appInsights.trackPageView();
    }
  }

  public render(): void {
    const element: React.ReactElement<ICustomerManagerProps> = React.createElement(
      CustomerManager,
      {
        context: this.context,
        apiBaseUrl: this.properties.apiBaseUrl,
        appInsights: this._appInsights,
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('apiBaseUrl', {
                  label: strings.APIUrlFieldLabel
                }),
                PropertyPaneTextField('appInsightsInstrumentationKey', {
                  label: strings.AppInsightsInstrumentationKey
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
