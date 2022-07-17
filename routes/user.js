const { Router } = require("express");
const express = require("express");
const { updateStatus } = require("../controllers/user");

const { isAuthenticatedAdmin } = require("../middlewares/auth");
const router = express.Router();


//CHANGE USER STATUS
router.route("/").post(isAuthenticatedAdmin, updateStatus);


module.exports = router;