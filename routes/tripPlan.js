const express = require("express");
const { getAllTripPlans, updateTripPlanStatus } = require("../controllers/tripPlan");
const { isAuthenticatedAdmin } = require("../middlewares/auth");
const router = express.Router();

//GET ALL TRIP PLANS
router.route("/").get(isAuthenticatedAdmin, getAllTripPlans);


router.route("/:plan_id").patch(isAuthenticatedAdmin, updateTripPlanStatus);
module.exports = router;