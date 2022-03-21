const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const {
  registerUser,
  loginUser,
  editProfile,
  viewOwnProfile,
  followUnfollowUser,
  viewOthersProfile,
  uploadProfileImage,
  uploadCoverImage,
} = require("../controllers/user");
const { validateUser } = require("../middlewares/validations/userValidator");

const { isAuthenticated } = require("../middlewares/auth");

const router = express.Router();

//REGISTER USER
router.route("/register").post(validateUser("createUser"), registerUser);
//LOGIN, EDIT PROFILE AND VIEW OWN PROFILE
router.route("/login").post(validateUser("loginUser"), loginUser);
router
  .route("/")
  .put(isAuthenticated, validateUser("editProfile"), editProfile)
  .get(isAuthenticated, viewOwnProfile);

//UPLOAD OR CHANGE PROFILE
router
  .route("/changeProfileImage")
  .post(isAuthenticated, upload.single("image"), uploadProfileImage);

//UPLOAD OR CHANGE COVER PHOTO
router
  .route("/changeCover")
  .post(isAuthenticated, upload.single("cover"), uploadCoverImage);

//FOLLOW UNFOLLOW USER
router
  .route("/:id")
  .post(isAuthenticated, followUnfollowUser)
  .get(isAuthenticated, viewOthersProfile);

module.exports = router;
