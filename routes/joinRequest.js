const { Router } = require("express");
const express = require("express");
const { viewRequest, requestAction } = require("../controllers/joinRequest");
const { isAuthenticatedAdmin } = require("../middlewares/auth");
const router = express.Router();


router.route("/joinRequest").get(isAuthenticatedAdmin, viewRequest)
                            .post(isAuthenticatedAdmin, requestAction);


module.exports = router;