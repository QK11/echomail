"use strict";

const { Schema, model } = require("mongoose");

const mailSchema = new Schema({
  mailId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  receivedAt: {
    type: Date,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  bodyPreview: {
    type: String,
    required: true
  },
  body: {
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    }
  },
  isRead: {
    type: Boolean,
    required: true
  },
  sender: {
    name: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  toRecipients: [
    {
      name: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      }
    }
  ]
});

const Mail = model("Mail", mailSchema);

module.exports = Mail;
