const { Router } = require("express");
const express = require("express");
const { userSession } = require("../controllers/usage");
const { isAuthenticatedAdmin } = require("../middlewares/auth");
const router = express.Router();


router.route("/session").post(isAuthenticatedAdmin, userSession);


module.exports = router;