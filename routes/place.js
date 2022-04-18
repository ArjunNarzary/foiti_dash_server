const express = require("express");
const {
  searchPlace,
  getPlace,
  addEditReview,
  autocompletePlace,
  getPlacePosts,
} = require("../controllers/place");
const router = express.Router();

const { isAuthenticated } = require("../middlewares/auth");
const { validatePlace } = require("../middlewares/validations/placeValidator");

//Search Places
router.route("/search").get(isAuthenticated, searchPlace);
//Autocomplete Places
router.route("/autocomplete/search").get(isAuthenticated, autocompletePlace);

//ADD, edit and Delete REVIEW
router
  .route("/review/:place_id")
  .post(isAuthenticated, validatePlace("addReview"), addEditReview);

//GET PLACE
router.route("/:place_id")
      .get(isAuthenticated, getPlace)
      .post(isAuthenticated, getPlacePosts);

module.exports = router;