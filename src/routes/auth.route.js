"use strict";

const express = require("express");
const router = express.Router();

const {
  signin,
  logout,
  callback
} = require("../controllers/signin.controller");

router.get("/signin", signin);
router.get("/logout", logout);

router.get("/callback", callback);

module.exports = router;
