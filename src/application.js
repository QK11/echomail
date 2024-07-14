"use strict";

const cookieParser = require("cookie-parser");
const { default: axios } = require("axios");
const session = require("express-session");
const requestLogger = require("morgan");
const express = require("express");

const MongoStore = require("connect-mongo");
const config = require("./configuration");
const app = express();

const store = MongoStore.create({
  mongoUrl: config.mongo.uri,
  collectionName: "sessions"
});

// app.use(helmet()); // Must be used in production

app.set("view engine", "ejs");
app.set("views", `${__dirname}/views`);

app.use(
  session({
    secret: config.express.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Must be true in production
      maxAge: 60 * 60 * 1000 // 1 hour
    },
    store: store
  })
);

app.use(requestLogger("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.get("/", async (req, res) => {
  const { isAuthenticated, account } = req.session;

  res.status(200).render("index", {
    title: "Welcome to EchoMail",
    isAuthenticated: isAuthenticated === true,
    profile: {
      username: account?.username,
      name: account?.name
    }
  });
});

app.get("/inbox", async (req, res) => {
  const { isAuthenticated, accessToken } = req.session;

  if (!isAuthenticated) {
    return res.redirect("/");
  }

  const { page } = req.query;

  const pageNumber = parseInt(page, 10);
  const pageSize = 9;

  let inboxUrl = `https://graph.microsoft.com/v1.0/me/messages?$top=${pageSize}`;

  if (pageNumber) {
    inboxUrl += `&$skip=${pageNumber * pageSize}`;
  }

  const inboxResponse = await axios.get(inboxUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const mails = inboxResponse.data.value.map(function (mail) {
    return {
      id: mail.id,
      receivedAt: mail.receivedDateTime,
      checksum: mail.changeKey,
      subject: mail.subject,
      bodyPreview: mail.bodyPreview,
      body: {
        content: mail.body.content,
        type: mail.body.contentType
      },
      importance: mail.importance,
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

  const hasNext = inboxResponse.data["@odata.nextLink"] !== undefined;

  res.status(200).render("inbox", {
    title: "Inbox - EchoMail",
    isAuthenticated: isAuthenticated === true,
    mails: mails,
    hasNext: hasNext,
    nextPage: pageNumber + 1 || 1,
    previousPage: pageNumber - 1 || 0
  });
});

app.use("/auth", require("./routes/auth.route"));

app.use((req, res) => {
  res.sendStatus(404);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.sendStatus(500);
});

module.exports = app;
