"use strict";

const { Schema, model } = require("mongoose");
const { Queue } = require("bullmq");

const configuration = require("../configuration");

const primaryQueue = new Queue("Primary", {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000
    },
    removeOnComplete: {
      age: 1000 * 60 * 60 * 48 // 48 hours
    },
    removeOnFail: {
      age: 1000 * 60 * 60 * 48 // 48 hours
    }
  },
  connection: {
    host: configuration.redis.host,
    port: configuration.redis.port,
    db: configuration.redis.db
  }
});

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    accessToken: {
      value: {
        type: String,
        required: true
      },
      expiration: {
        type: Date,
        required: true
      }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const User = model("User", userSchema);

User.watch().on("change", async (change) => {
  const { operationType } = change;

  if (operationType !== "insert") {
    return;
  }

  const {
    documentKey: { _id }
  } = change;

  const userId = _id.toString();

  await primaryQueue.add(
    "initial-mailbox-sync",
    {
      userId: userId
    },
    {
      jobId: userId
    }
  );

  // Setup Change Subscription
  // https://learn.microsoft.com/en-us/graph/change-notifications-overview
});

module.exports = User;
