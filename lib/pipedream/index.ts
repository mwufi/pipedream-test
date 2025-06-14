import pd from "../server/pipedream_client";
import type { ConnectTokenResponse } from "@pipedream/sdk";

export interface CreateConnectTokenOptions {
  external_user_id: string;
  allowed_origins?: string[];
  success_redirect_uri?: string;
  error_redirect_uri?: string;
  webhook_uri?: string;
}

export interface ListAccountsOptions {
  app?: string;
  oauth_app_id?: string;
  external_user_id?: string;
  include_credentials?: boolean;
}

export interface AccountDetails {
  id: string;
  name?: string;
  app?: string;
  oauth_app_id?: string;
  external_user_id?: string;
  healthy?: boolean;
  dead?: boolean;
  created_at?: string;
  updated_at?: string;
  credentials?: any;
}

export interface Component {
  key: string;
  name: string;
  description?: string;
  version?: string;
  type?: string;
  app?: string;
}

export interface ConfigureComponentOptions {
  configured_props: Record<string, any>;
  external_user_id: string;
  id: string;
  prop_name: string;
}

class PipedreamAPI {
  // Token Management
  async createConnectToken(options: CreateConnectTokenOptions): Promise<ConnectTokenResponse> {
    try {
      const token = await pd.createConnectToken({
        external_user_id: options.external_user_id,
        allowed_origins: options.allowed_origins,
        success_redirect_uri: options.success_redirect_uri,
        error_redirect_uri: options.error_redirect_uri,
        webhook_uri: options.webhook_uri,
      });
      return token;
    } catch (error) {
      throw new Error(`Failed to create connect token: ${error}`);
    }
  }

  // Account Management
  async listAccounts(options?: ListAccountsOptions): Promise<any> {
    try {
      const accounts = await pd.getAccounts({
        app_name: options?.app,
        oauth_app_id: options?.oauth_app_id,
        external_user_id: options?.external_user_id,
        include_credentials: options?.include_credentials,
      });
      return accounts;
    } catch (error) {
      throw new Error(`Failed to list accounts: ${error}`);
    }
  }

  async getAccount(accountId: string, includeCredentials = false): Promise<any> {
    try {
      const account = await pd.getAccountById(accountId, {
        include_credentials: includeCredentials,
      });
      return account;
    } catch (error) {
      throw new Error(`Failed to get account: ${error}`);
    }
  }

  async deleteAccount(accountId: string): Promise<void> {
    try {
      await pd.deleteAccount(accountId);
    } catch (error) {
      throw new Error(`Failed to delete account: ${error}`);
    }
  }

  async deleteAllAccountsForApp(appId: string): Promise<void> {
    try {
      await pd.deleteAccountsByApp(appId);
    } catch (error) {
      throw new Error(`Failed to delete accounts for app: ${error}`);
    }
  }

  // User Management
  async deleteExternalUser(externalUserId: string): Promise<void> {
    try {
      await pd.deleteExternalUser(externalUserId);
    } catch (error) {
      throw new Error(`Failed to delete external user: ${error}`);
    }
  }

  // Component Management
  async listComponents(componentType: string, options?: { app?: string; q?: string }): Promise<any> {
    try {
      // The SDK getComponents method doesn't seem to support component type filtering
      // so we'll use it directly
      const components = await pd.getComponents({
        app: options?.app,
        q: options?.q,
      });
      return components;
    } catch (error) {
      throw new Error(`Failed to list components: ${error}`);
    }
  }

  async getComponent(componentType: string, componentKey: string): Promise<any> {
    try {
      // The SDK expects just the component key/id
      const component = await pd.getComponent(componentKey);
      return component;
    } catch (error) {
      throw new Error(`Failed to get component: ${error}`);
    }
  }

  async configureComponent(componentType: string, options: ConfigureComponentOptions): Promise<any> {
    try {
      // This method might not be directly available in the SDK
      // We'll need to use makeRequest for this
      const projectId = pd.getProjectId();
      const response = await pd.makeRequest(`/${projectId}/components/${componentType}/configure`, {
        method: "POST",
        body: JSON.stringify(options),
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to configure component: ${error}`);
    }
  }
}

export const pipedream = new PipedreamAPI();