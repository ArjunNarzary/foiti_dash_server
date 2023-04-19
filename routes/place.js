const { Router } = require("express");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const express = require("express");
const { allPlaces, getPlace, changeName, updateCoors, changeAddress, addEditCustomType, addEditAlias, changeDisplayAddress, searchPlace, setOriginalPlace, deleteOriginalPlace, toggleShowDestination, toggleDestination, setSearchRank, setEditorRating, mergeDisplayAddress, changeCover, setOriginalDisplayName, deleteCover, setReviewRequired, changeReviewRequiredStatus } = require("../controllers/place");
const { isAuthenticatedAdmin } = require("../middlewares/auth");
const router = express.Router();


router.route("/").get(isAuthenticatedAdmin, allPlaces);
router.route("/changeAddress/:place_id").post(isAuthenticatedAdmin, changeAddress);
router.route("/changeDisplayAddress/:place_id").post(isAuthenticatedAdmin, changeDisplayAddress)
                                        .put(isAuthenticatedAdmin, mergeDisplayAddress);
router.route("/type/:place_id").post(isAuthenticatedAdmin, addEditCustomType);
router.route("/alias/:place_id").post(isAuthenticatedAdmin, addEditAlias);
router.route("/showDestination/:place_id").post(isAuthenticatedAdmin, toggleShowDestination);
router.route("/destination/:place_id").post(isAuthenticatedAdmin, toggleDestination);
router.route("/search-rank/:place_id").post(isAuthenticatedAdmin, setSearchRank);
router.route("/editor-rating/:place_id").post(isAuthenticatedAdmin, setEditorRating);
router.route("/originalPlace/:place_id").post(isAuthenticatedAdmin, setOriginalPlace)
                                        .delete(isAuthenticatedAdmin, deleteOriginalPlace);
router.route("/change-review-required-status").patch(isAuthenticatedAdmin, changeReviewRequiredStatus);


router
  .route("/change-cover/:place_id")
  .post(isAuthenticatedAdmin, upload.single("coverPhoto"), changeCover)
  .delete(isAuthenticatedAdmin, deleteCover);
router.route("/search").get(isAuthenticatedAdmin, searchPlace);

//=======TEMPORARY LINK TO COPY ORIGINAL NAME TO DISPLAY NAME
router.route("/set-display-name-original-name").get(isAuthenticatedAdmin, setOriginalDisplayName);
//=======TEMPORARY LINK TO COPY ORIGINAL NAME TO DISPLAY NAME

//ADD ROUTES ABOVE THIS LINE
router.route("/:place_id").get(isAuthenticatedAdmin, getPlace)           //GET PLACE DETAILS
                           .post(isAuthenticatedAdmin, changeName)    //CHANGE PLACE NAME
                           .put(isAuthenticatedAdmin, updateCoors);    //UPDATE PLACE COORDINATES


module.exports = router;