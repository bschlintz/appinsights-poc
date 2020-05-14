import { BaseComponentContext } from "@microsoft/sp-component-base";
import { MSGraphClient } from "@microsoft/sp-http";
import { GraphUser } from "../models/GraphUser";
import CacheService from "./CacheService";

const CACHEKEY_CURRENTUSER = "__GraphService__CurrentUser";

export class GraphService {
  private _context: BaseComponentContext;
  private _graphClient: MSGraphClient;

  constructor(context: BaseComponentContext) {
    this._context = context;
  }

  private _getGraphClient = async (): Promise<MSGraphClient> => {
    if (!this._graphClient) {
      this._graphClient = await this._context.msGraphClientFactory.getClient();
    }
    return this._graphClient;
  }

  private _getCurrentUser = async (): Promise<GraphUser> => {
    try {
      const graphClient = await this._getGraphClient();
      const selectProperties = [ "department", "displayName", "jobTitle", "mail", "userType", "userPrincipalName" ];
      const response = await graphClient.api(`me`).version(`v1.0`).select(selectProperties).get();
      return response;
    }
    catch (error) {
      throw error;
    }
  }

  public getCurrentUser = async (): Promise<GraphUser> => {
    let currentUser = CacheService.get(CACHEKEY_CURRENTUSER);

    if (!currentUser) {
      currentUser = await this._getCurrentUser();
      CacheService.set(CACHEKEY_CURRENTUSER, currentUser);
    }

    return currentUser;
  }

}
