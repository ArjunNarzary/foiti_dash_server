const express = require("express");
const { getImage } = require("../controllers/image");

const { isAuthenticated } = require("../middlewares/auth");

const router = express.Router();

//GET IMAGE FROM S3
router.route("/:key").get(isAuthenticated, getImage);

module.exports = router;
