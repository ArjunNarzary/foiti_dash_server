const { Router } = require("express");
const express = require("express");
const { allPlaces, getPlace, changeName } = require("../controllers/place");
const { isAuthenticatedAdmin } = require("../middlewares/auth");
const router = express.Router();


router.route("/").get(isAuthenticatedAdmin, allPlaces);
router.route("/:place_id").get(isAuthenticatedAdmin, getPlace)           //GET PLACE DETAILS
                           .post(isAuthenticatedAdmin, changeName);    //CHANGE PLACE NAME


module.exports = router;