const express = require("express");
const { usersPostCount, usersPost, updatePostStatus } = require("../controllers/posts");
const { isAuthenticatedAdmin } = require("../middlewares/auth");
const router = express.Router();

//USERS POST COUNTS
router.route("/").get(isAuthenticatedAdmin, usersPostCount);

//GET ALL POST OF USER
router.route("/:user_id").get(isAuthenticatedAdmin, usersPost);
router.route("/:post_id").post(isAuthenticatedAdmin, updatePostStatus);


module.exports = router;