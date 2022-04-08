const express = require("express");
const {
  searchPlace,
  getPlace,
  addEditReview,
} = require("../controllers/place");
const router = express.Router();

const { isAuthenticated } = require("../middlewares/auth");
const { validatePlace } = require("../middlewares/validations/placeValidator");

//Create Post
router.route("/search").get(isAuthenticated, searchPlace);

//ADD, edit and Delete REVIEW
router
  .route("/review/:place_id")
  .post(isAuthenticated, validatePlace("addReview"), addEditReview);

//GET PLACE
router.route("/:place_id").get(isAuthenticated, getPlace);

module.exports = router;
