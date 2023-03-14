const { Router } = require("express");
const express = require("express");
const { updateStatus, recalculateContribution, allUsers, totalUsers, updateHiddenMeetupProfile } = require("../controllers/user");

const { isAuthenticatedAdmin } = require("../middlewares/auth");
const router = express.Router();


//CHANGE USER STATUS
router.route("/").post(isAuthenticatedAdmin, updateStatus)
                  .get(isAuthenticatedAdmin, allUsers);
router.route("/meetup-profile").post(isAuthenticatedAdmin, updateHiddenMeetupProfile)
router.route("/contribution").post(isAuthenticatedAdmin, recalculateContribution);
router.route("/total-users").get(isAuthenticatedAdmin, totalUsers);


module.exports = router;