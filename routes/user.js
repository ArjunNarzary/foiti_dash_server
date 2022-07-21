const { Router } = require("express");
const express = require("express");
const { updateStatus, recalculateContribution, allUsers } = require("../controllers/user");

const { isAuthenticatedAdmin } = require("../middlewares/auth");
const router = express.Router();


//CHANGE USER STATUS
router.route("/").post(isAuthenticatedAdmin, updateStatus)
                  .get(isAuthenticatedAdmin, allUsers);
router.route("/contribution").post(isAuthenticatedAdmin, recalculateContribution);


module.exports = router;