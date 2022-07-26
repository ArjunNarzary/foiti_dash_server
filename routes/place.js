const { Router } = require("express");
const express = require("express");
const { allPlaces, getPlace, changeName, updateCoors, changeAddress, addEditCustomType } = require("../controllers/place");
const { isAuthenticatedAdmin } = require("../middlewares/auth");
const router = express.Router();


router.route("/").get(isAuthenticatedAdmin, allPlaces);
router.route("/changeAddress/:place_id").post(isAuthenticatedAdmin, changeAddress);
router.route("/type/:place_id").post(isAuthenticatedAdmin, addEditCustomType);
router.route("/:place_id").get(isAuthenticatedAdmin, getPlace)           //GET PLACE DETAILS
                           .post(isAuthenticatedAdmin, changeName)    //CHANGE PLACE NAME
                           .put(isAuthenticatedAdmin, updateCoors);    //UPDATE PLACE COORDINATES


module.exports = router;