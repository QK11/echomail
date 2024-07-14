"use strict";

const User = require("../models/user");
const Mail = require("../models/mail");

const { default: axios } = require("axios");

/**
 * @typedef {Object} Mail The mail object
 * @property {string} id Mail ID
 * @property {Date} receivedAt Received at
 * @property {string} subject Subject
 * @property {string} bodyPreview Body preview
 * @property {Object} body Body
 * @property {string} body.content Body content
 * @property {string} body.type Body type
 * @property {boolean} isRead Is read
 * @property {Object} sender Sender
 * @property {string} sender.name Sender name
 * @property {string} sender.address Sender address
 * @property {Object[]} toRecipients To recipients
 * @property {string} toRecipients[].name Recipient name
 * @property {string} toRecipients[].address Recipient address
 */

/**
 * Fetch emails from the Microsoft Graph API
 * @param {string} userId User ID
 * @param {string} accessToken Access token
 * @returns {AsyncGenerator<Mail[]>} Emails
 */
async function* fetchEmails(userId, accessToken) {
  const headers = {
    Authorization: `Bearer ${accessToken}`
  };

  let hasNext = false;
  let initialLink =
    "https://graph.microsoft.com/v1.0/me/messages?$select=id,receivedDateTime,subject,bodyPreview,body,isRead,sender,toRecipients&$top=25";

  do {
    const response = await axios.get(initialLink, {
      headers: headers
    });

    const data = response.data;

    const mails = data.value.map(function (mail) {
      return {
        mailId: mail.id,
        userId: userId,
        receivedAt: mail.receivedDateTime,
        subject: mail.subject,
        bodyPreview: mail.bodyPreview,
        body: {
          content: mail.body.content,
          type: mail.body.contentType
        },
        isRead: mail.isRead,
        sender: {
          name: mail.sender.emailAddress.name,
          address: mail.sender.emailAddress.address
        },
        toRecipients: mail.toRecipients.map(function (recipient) {
          return {
            name: recipient.emailAddress.name,
            address: recipient.emailAddress.address
          };
        })
      };
    });

    if (data["@odata.nextLink"] === undefined) {
      hasNext = false;
    } else {
      initialLink = data["@odata.nextLink"];
      hasNext = true;
    }

    yield mails;
  } while (hasNext);
}

/**
 * Handle a job
 * @param {import("bullmq").Job<{ userId : string }>} job Job
 */
async function handleJob(job) {
  console.log(`Processing job ${job.id} of type ${job.name}`);

  const { userId } = job.data;

  const user = await User.findById(userId);

  if (!user) {
    console.log(`User ${userId} not found`);
    return;
  }

  const now = new Date();
  if (user.accessToken.expiration < now) {
    console.log(`Access token for user ${userId} has expired`);
    return;
  }

  let totalMails = 0;
  for await (const mails of fetchEmails(userId, user.accessToken.value)) {
    await Mail.insertMany(mails);

    totalMails += mails.length;
    console.log(`Inserted ${totalMails} mails for user ${userId}`);

    // Abort if we fetched 100 mails (for demo purposes)
    if (totalMails >= 100) {
      break;
    }

    // Wait for 1 second before fetching the next batch
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`Processed job ${job.id} 🎉`);
}

module.exports = handleJob;
