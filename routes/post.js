const express = require("express");
const { usersPostCount, usersPost, updatePostStatus, updateCoors, viewPostDetails, updatePostLocation } = require("../controllers/posts");
const { isAuthenticatedAdmin } = require("../middlewares/auth");
const router = express.Router();

//USERS POST COUNTS
router.route("/").get(isAuthenticatedAdmin, usersPostCount);

//GET ALL POST OF USER
router.route("/updateCoors/:post_id").post(isAuthenticatedAdmin, updateCoors);
router.route("/user/:user_id").get(isAuthenticatedAdmin, usersPost);
router.route("/updateLocation/:post_id").post(isAuthenticatedAdmin, updatePostLocation);
router.route("/:post_id").post(isAuthenticatedAdmin, updatePostStatus)
                          .get(isAuthenticatedAdmin, viewPostDetails);


module.exports = router;