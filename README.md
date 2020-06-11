# App Insights Proof of Concept
## Overview
The goal of this POC is to demonstrate how [Azure Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview) can be used to instrument an application end-to-end. The application consists of a SharePoint Framework web part, Azure API Management securing an Azure App Service API written in .NET Core, and a SQL database hosted in Azure SQL. Every layer of the application is enabled for App Insights so it becomes possible to see a complete transaction starting from the SharePoint web part to the SQL database query and back.

![](/images/AI_ApplicationMap.png)
![](/images/AI_E2ETransaction.png)

## Instrumenting App Insights
### SharePoint Framework
Start by installing the [Azure Application Insights for web pages](https://docs.microsoft.com/en-us/azure/azure-monitor/app/javascript) package in your SPFx project. You can install it by using NPM.

```bash
npm install @microsoft/applicationinsights-web
```

Check out [Application Insights JavaScript SDK](https://github.com/microsoft/applicationinsights-js#application-insights-javascript-sdk) on GitHub for a detailed list of configuration options, methods, and setup instructions.

The POC code sample for configuring the AI SDK within the an SPFx web part is available here: [CustomerManagerWebPart.ts#L55](https://github.com/bschlintz/appinsights-poc/blob/master/spfx/src/webparts/customerManager/CustomerManagerWebPart.ts#L55). You must provide an instrumentation key when initializing AI which is made configurable by an SPFx web part.

#### Filter telemetry sent by domain
Adding AI to SharePoint pages requires some additional configuration to filter out excess noise. To do this, the POC utilizes a whitelist approach to only track requests going to the domain hosting the custom API which accompanies this application. Without this in place, you will see 25+ additional dependencies tracked with every page load as AI tracks native SharePoint and other Office 365 requests unrelated to your application. See [CustomerManagerWebPart.ts#L31](https://github.com/bschlintz/appinsights-poc/blob/master/spfx/src/webparts/customerManager/CustomerManagerWebPart.ts#L31).

#### Capture custom user data
Capturing additional information about users interacting with an application can also be useful to analyze usage and debug issues. The POC makes a call to the Microsoft Graph API on behalf of the user to retrieve information such as their department, job title, and user type. This data is then attached as custom properties to all AI telemetry by the user. See [CustomerManagerWebPart.ts#34](https://github.com/bschlintz/appinsights-poc/blob/master/spfx/src/webparts/customerManager/CustomerManagerWebPart.ts#L34).

#### Track custom events
AI allows you to send telemetry to track custom events within your application, such as a user clicking a button or saving an entry. This is useful to determine how your users are interacting with your application and may inform which features are most and least used. See [CustomerManager.ts#L98](https://github.com/bschlintz/appinsights-poc/blob/master/spfx/src/webparts/customerManager/components/CustomerManager.tsx#L98) and [#L62](https://github.com/bschlintz/appinsights-poc/blob/master/spfx/src/webparts/customerManager/components/CustomerManager.tsx#L62). Read more here: [TrackEvent](https://docs.microsoft.com/en-us/azure/azure-monitor/app/api-custom-events-metrics#trackevent).

### Azure API Management (APIM)
APIM natively integrates with AI via configuration within the Azure Portal. You can configure sampling to track a perceptage of requests or leave at 100% to capture all of them. See screenshot below and read more here: [How to integrate Azure API Management with Azure Application Insights](https://docs.microsoft.com/en-us/azure/api-management/api-management-howto-app-insights).

**Step 1: Add App Insights to APIM Instance**
![](/images/APIM_Step1.png)

**Step 2: Configure App Insights on API Definition**
![](/images/APIM_Step2.png)

### Azure App Service: .NET Core API
App Service can instrument runtime monitoring without any code changes by simply enabling it within the Azure Portal. To have more control over the instrumentation and send custom telemetry, you will need to install the [Microsoft.ApplicationInsights.AspNetCore Nuget package](https://www.nuget.org/packages/Microsoft.ApplicationInsights.AspNetCore) to your .NET core project. Read more here: [Monitor Azure App Service performance](https://docs.microsoft.com/en-us/azure/azure-monitor/app/azure-web-apps?tabs=netcore).

```bash
dotnet add package Microsoft.ApplicationInsights.AspNetCore
```

After installing the Nuget package, you will need to enable App Insights Telemetry in your application code. You can see it in the sample Web API at [Startup.cs#L29](https://github.com/bschlintz/appinsights-poc/blob/master/azure-webapi/Startup.cs#L29) and read more here: [Application Insights for ASP.NET Core applications](https://docs.microsoft.com/en-us/azure/azure-monitor/app/asp-net-core).

#### Enable advanced logging: SQL commands
To get even more insight into the health of your application, you can enable logging of your SQL commands. As long as your .NET core application uses the Microsoft SQL classes to interact with a database, those SQL commands can be monitored automatically by AI. Read more here: [Advanced SQL tracking to get full SQL Query](https://docs.microsoft.com/en-us/azure/azure-monitor/app/asp-net-dependencies#advanced-sql-tracking-to-get-full-sql-query).

![](/images/AppService_SQL.png)

## Configuring App Insights
With your application instrumented with AI, many features will automatically begin working within the App Insights portal such as the [Application Map](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-map?tabs=net), [Live Metrics](https://docs.microsoft.com/en-us/azure/azure-monitor/app/live-stream), [Search](https://docs.microsoft.com/en-us/azure/azure-monitor/app/diagnostic-search), [Failures](https://docs.microsoft.com/en-us/azure/azure-monitor/app/asp-net-exceptions), [Performance](https://docs.microsoft.com/en-us/azure/azure-monitor/learn/tutorial-performance), [Users](https://docs.microsoft.com/en-us/azure/azure-monitor/learn/tutorial-users) and [Sessions](https://docs.microsoft.com/en-us/azure/azure-monitor/app/usage-segmentation). To get even more out of AI, you can configure additional components described below.

### Application Dashboard
Having a comprehensive dashboard describing the overall health of your application is extremely useful. Fortunately, AI can produce a robust dashboard for you with one-click from which you can further customize to show specific metrics relevant to your application. Read more: [Application Insights Overview dashboard](https://docs.microsoft.com/en-us/azure/azure-monitor/app/overview-dashboard).

![](/images/AI_Dashboard.png)

### Availability
AI allows you to setup basic ping tests to monitor the availability of your application. These are basic web tests that make a request to a specified URL every 5/10/15 minutes and validate it comes back with an expected response. If the request returns an invalid response, an alert is raised. Read more: [Monitor the availability of any website](https://docs.microsoft.com/en-us/azure/azure-monitor/app/monitor-web-app-availability).

In the POC API, there is a simple anonymously-accessible Ping controller which is designed to be used by the availability web test to verify the API is online. See [PingController.cs](https://github.com/bschlintz/appinsights-poc/blob/master/azure-webapi/Controllers/PingController.cs) and configuration of the URL ping test below.

![](/images/AI_Availability.png)

### Alerts
To get the most out of AI, Alerts can be configured to respond to specific scenarios that might happen within your application such as SQL deadlocks, HTTP 500 errors, etc. Alerts support a comprehensive set of conditions and can trigger a number of different actions including an Automation Runbook, Azure Function, Email/SMS/Push Notification, Logic App, Webhook or ITSM incident. Read more: [Set Alerts in Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/alerts).

### Smart Detection
There are several smart detection rules built-in which learn your application over time and will alert when anomalies are detected. You cannot add your own smart detection rules, but you can configure what happens when one of the built-in rules are triggered. For example, you may want to receive an email when an alert is raised or even trigger a Logic App to restart the application or clear a cache. Read more: [Smart Detection in Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/proactive-diagnostics).

![](/images/AI_SmartDetection.png)

## Disclaimer
Microsoft provides programming examples for illustration only, without warranty either expressed or implied, including, but not limited to, the implied warranties of merchantability and/or fitness for a particular purpose. We grant You a nonexclusive, royalty-free right to use and modify the Sample Code and to reproduce and distribute the object code form of the Sample Code, provided that You agree: (i) to not use Our name, logo, or trademarks to market Your software product in which the Sample Code is embedded; (ii) to include a valid copyright notice on Your software product in which the Sample Code is embedded; and (iii) to indemnify, hold harmless, and defend Us and Our suppliers from and against any claims or lawsuits, including attorneys' fees, that arise or result from the use or distribution of the Sample Code.