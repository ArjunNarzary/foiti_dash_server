const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const {
  createPost,
  likeUnlikePost,
  editPost,
  viewPost,
  savePost,
} = require("../controllers/post");
const { isAuthenticated } = require("../middlewares/auth");
const router = express.Router();

//Create Post
router.route("/").post(isAuthenticated, upload.single("postImage"), createPost);

//Like POST
router.route("/like/:id").get(isAuthenticated, likeUnlikePost);
//Save and Unsave post
router.route("/save/:id").get(isAuthenticated, savePost);

//EDIT, VIEW and DELETE POST
router
  .route("/:id")
  .put(isAuthenticated, editPost)
  .get(isAuthenticated, viewPost);

module.exports = router;
