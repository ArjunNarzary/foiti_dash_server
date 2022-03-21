const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { createPost } = require("../controllers/post");
const { isAuthenticated } = require("../middlewares/auth");
const router = express.Router();

//Create Post
router.route("/").post(isAuthenticated, upload.single("postImage"), createPost);

module.exports = router;
