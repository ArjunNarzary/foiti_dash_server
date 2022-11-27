const express = require("express");
const { getPost } = require("../controllers/website");

// const { isAuthenticated } = require("../middlewares/auth");

const router = express.Router();

//GET POST DETAILS
router.route("/post/:post_id").get(getPost);

module.exports = router;
