"use strict";

const {
  // Application
  EXPRESS_SESSION_SECRET,
  NODE_ENV,
  PORT,

  // Microsoft Graph API
  TENANT_ID,
  CLIENT_ID ,
  CLIENT_SECRET,

  // MongoDB
  MONGO_HOST,
  MONGO_REPLICA_SET,
  MONGO_DATABASE,

  // Redis
  REDIS_HOST,
  REDIS_PORT,
  REDIS_DB
} = process.env;

module.exports = {
  express: {
    port: PORT,
    environment: NODE_ENV,
    secret: EXPRESS_SESSION_SECRET
  },
  auth: {
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri:
      "https://ebc29e4a043f-3649381288066616033.ngrok-free.app/auth/callback"
  },
  mongo: {
    host: MONGO_HOST,
    database: MONGO_DATABASE,
    uri: `mongodb://${MONGO_HOST}/${MONGO_DATABASE}?replicaSet=${MONGO_REPLICA_SET}`
  },
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    db: REDIS_DB
  }
};
