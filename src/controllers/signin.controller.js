"use strict";

const AuthService = require("../services/auth.service");
const configuration = require("../configuration");
const User = require("../models/user");

/** @type {AuthService} */
let authService;
AuthService.init({
  clientId: configuration.auth.clientId,
  clientSecret: configuration.auth.clientSecret,
  authority: configuration.auth.authority
}).then((service) => {
  authService = service;
});

/**
 * Signin user via msal-node
 * @param {import('express').Request} req Request
 * @param {import('express').Response} res Response
 * @param {import('express').NextFunction} next Next
 */
async function signin(req, res, next) {
  try {
    const { authCodeUrl, pkceCodes } = await authService.getAuthCodeUrl({
      scopes: ["Mail.Read", "User.Read"],
      redirectUri: configuration.auth.redirectUri
    });

    // Save the PKCE Codes in the session
    req.session.pkceCodes = {
      verifier: pkceCodes.verifier
    };

    res.redirect(authCodeUrl);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle callback from Microsoft Identity Platform
 * @param {import('express').Request} req Request
 * @param {import('express').Response} res Response
 * @param {import('express').NextFunction} next Next
 */
async function callback(req, res, next) {
  const { code, client_info } = req.query;

  const {
    tokenCache,
    pkceCodes: { verifier }
  } = req.session;

  try {
    const callbackResponse = await authService.handleCallback({
      scopes: ["Mail.Read", "User.Read"],
      tokenCache: tokenCache,
      client_info: client_info,
      redirectUri: configuration.auth.redirectUri,
      code: code,
      verifier: verifier
    });

    // Ensure the user exists in the database
    // and updates the access token
    await User.findOneAndUpdate(
      {
        username: callbackResponse.account.username.toLowerCase()
      },
      {
        username: callbackResponse.account.username.toLowerCase(),
        name: callbackResponse.account.name,
        accessToken: {
          value: callbackResponse.accessToken,
          expiration: new Date(
            callbackResponse.account.idTokenClaims.exp * 1000
          )
        }
      },
      {
        upsert: true
      }
    );

    req.session.tokenCache = callbackResponse.tokenCache;
    req.session.idToken = callbackResponse.idToken;
    req.session.accessToken = callbackResponse.accessToken;
    req.session.account = callbackResponse.account;
    req.session.isAuthenticated = true;

    res.redirect("/");
  } catch (error) {
    next(error);
  }
}

/**
 * Destroy the session and redirect to the
 * @param {import('express').Request} req Request
 * @param {import('express').Response} res Response
 * @param {import('express').NextFunction} next Next
 */
async function logout(req, res, next) {
  try {
    req.session.destroy(() => {
      res.redirect("/");
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  signin,
  logout,
  callback
};
