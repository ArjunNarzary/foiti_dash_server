const express = require("express");
const {
  usersPostCount,
  usersPost,
  updatePostStatus,
  updateCoors,
  viewPostDetails,
  updatePostLocation,
  allPostWithCoordinates,
  changePostPlace,
  allPost,
  updatePostRecommend,
  removePost,
  setRecommend,
  removePostCoordinate,
} = require("../controllers/posts");
const { isAuthenticatedAdmin } = require("../middlewares/auth");
const router = express.Router();

//USERS POST COUNTS
router.route("/").get(isAuthenticatedAdmin, usersPostCount);
//GET ALL POST OF USER
router.route("/updateCoors/:post_id").post(isAuthenticatedAdmin, updateCoors);
router.route("/user/:user_id").get(isAuthenticatedAdmin, usersPost);
router
  .route("/updateLocation/:post_id")
  .post(isAuthenticatedAdmin, updatePostLocation);
router.route("/change-place").post(isAuthenticatedAdmin, changePostPlace);

//GET ALL POSTS WOTH COORDINATES
router
  .route("/all-post-with-coordinates")
  .post(isAuthenticatedAdmin, allPostWithCoordinates);
router.route("/all-post").post(isAuthenticatedAdmin, allPost);

//DELETE COORDINATES
router
  .route("/remove-coords/:post_id")
  .patch(isAuthenticatedAdmin, removePostCoordinate);

//WRITE ALL ROUTES ABOVE THIS ROUTE
router
  .route("/:post_id")
  .post(isAuthenticatedAdmin, updatePostStatus)
  .patch(isAuthenticatedAdmin, updatePostRecommend)
  .get(isAuthenticatedAdmin, viewPostDetails)
  .delete(isAuthenticatedAdmin, removePost);

module.exports = router;
