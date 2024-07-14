"use strict";

const { default: axios } = require("axios");

const {
  ConfidentialClientApplication,
  CryptoProvider,
  ResponseMode
} = require("@azure/msal-node");

class AuthService {
  /**
   * @param {Object} dependencies Dependencies
   * @param {ConfidentialClientApplication} dependencies.msalInstance MSAL Instance
   * @param {CryptoProvider} dependencies.cryptoProvider CryptoProvider
   */
  constructor(dependencies) {
    const { msalInstance, cryptoProvider } = dependencies;

    if (!(msalInstance instanceof ConfidentialClientApplication)) {
      throw new Error("MSAL Instance must be provided");
    }

    if (!(cryptoProvider instanceof CryptoProvider)) {
      throw new Error("CryptoProvider must be provided");
    }

    this.msalInstance = msalInstance;
    this.cryptoProvider = cryptoProvider;
  }

  /**
   * Initializes an instance of AuthService
   * @param {Object} credentials Credentials
   * @param {string} credentials.authority Authority
   * @param {string} credentials.clientId Client ID
   * @param {string} credentials.clientSecret Client Secret
   * @returns {AuthService} An instance of AuthService
   */
  static async init(credentials) {
    const [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
      AuthService.getCloudDiscoveryMetadata(credentials.authority),
      AuthService.getAuthorityMetadata(credentials.authority)
    ]);

    return new AuthService({
      authority: credentials.authority,
      cryptoProvider: new CryptoProvider(),
      msalInstance: new ConfidentialClientApplication({
        auth: {
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          authority: credentials.authority,
          authorityMetadata: authorityMetadata,
          cloudDiscoveryMetadata: cloudDiscoveryMetadata
        }
      })
    });
  }

  /**
   * Generates an auth code url with PKCE codes
   * @param {Object} options Options
   * @param {string} options.redirectUri Redirect URI
   * @param {string[]} [options.scopes] Scopes
   * @returns {Promise<{
   *  authCodeUrl: string,
   *  pkceCodes: {
   *   challengeMethod: string,
   *   verifier: string,
   *   challenge: string
   *   }
   * }>}
   */
  async getAuthCodeUrl(options = {}) {
    const { redirectUri, scopes = [] } = options;

    const { verifier, challenge } =
      await this.cryptoProvider.generatePkceCodes();

    const pkceCodes = {
      challengeMethod: "S256",
      verifier: verifier,
      challenge: challenge
    };

    const authCodeUrl = await this.msalInstance.getAuthCodeUrl({
      scopes: scopes,
      redirectUri: redirectUri,
      responseMode: ResponseMode.QUERY,
      codeChallenge: pkceCodes.challenge,
      codeChallengeMethod: pkceCodes.challengeMethod
    });

    return {
      authCodeUrl: authCodeUrl,
      pkceCodes: pkceCodes
    };
  }

  /**
   * Handles callback from Microsoft Identity
   * @param {Object} params Params
   * @param {string} params.tokenCache Token Cache
   * @param {string} params.code Code
   * @param {string} params.verifier Verifier
   * @param {string[]} [params.scopes] Scopes
   * @param {string} params.redirectUri Redirect URI
   * @param {string} params.client_info Client Info
   */
  async handleCallback(params) {
    const {
      tokenCache,
      code,
      verifier,
      scopes = [],
      redirectUri,
      client_info
    } = params;

    if (tokenCache) {
      this.msalInstance.getTokenCache().deserialize(tokenCache);
    }

    const tokenResponse = await this.msalInstance.acquireTokenByCode(
      {
        scopes: scopes,
        redirectUri: redirectUri,
        code: code,
        codeVerifier: verifier
      },
      {
        code: code,
        client_info: client_info
      }
    );

    return {
      tokenCache: this.msalInstance.getTokenCache().serialize(),
      accessToken: tokenResponse.accessToken,
      idToken: tokenResponse.idToken,
      account: tokenResponse.account
    };
  }

  /**
   * Retrieves cloud discovery metadata from the /discovery/instance endpoint
   * @param {string} authority Authority
   * @returns {Promise<Object>}
   */
  static async getCloudDiscoveryMetadata(authority) {
    const endpoint =
      "https://login.microsoftonline.com/common/discovery/instance";

    try {
      const response = await axios.get(endpoint, {
        params: {
          "api-version": "1.1",
          authorization_endpoint: `${authority}/oauth2/v2.0/authorize`
        }
      });

      return JSON.stringify(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves oidc metadata from the openid endpoint
   * @param {string} authority Authority
   * @returns {Promise<Object>}
   */
  static async getAuthorityMetadata(authority) {
    const endpoint = `${authority}/v2.0/.well-known/openid-configuration`;

    try {
      const response = await axios.get(endpoint);
      return JSON.stringify(response.data);
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = AuthService;
