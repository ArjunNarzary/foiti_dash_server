const express = require("express");
const { getPost, getPlace, getUser } = require("../controllers/website");

// const { isAuthenticated } = require("../middlewares/auth");

const router = express.Router();

//GET POST DETAILS
router.route("/post/:post_id").get(getPost);
router.route("/place/:place_id").get(getPlace);
router.route("/:user_id").get(getUser);

module.exports = router;
