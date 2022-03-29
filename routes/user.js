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
  resetPassword,
  updatePassword,
  viewAllPost,
  checkOtp,
  crateNewPassword,
  enterName,
} = require("../controllers/user");
const { validateUser } = require("../middlewares/validations/userValidator");

const { isAuthenticated } = require("../middlewares/auth");

const router = express.Router();

//REGISTER USER
router.route("/register").post(validateUser("createUser"), registerUser);
//LOGIN USER
router.route("/login").post(validateUser("loginUser"), loginUser);
// Edit name
router
  .route("/welcome")
  .post(isAuthenticated, validateUser("validateName"), enterName);
// EDIT PROFILE AND VIEW OWN PROFILE
router
  .route("/")
  .put(isAuthenticated, validateUser("editProfile"), editProfile)
  .get(isAuthenticated, viewOwnProfile);

//View posts of perticular user
router.route("/posts/:id").post(isAuthenticated, viewAllPost);

//UPLOAD OR CHANGE PROFILE
router
  .route("/changeProfileImage")
  .post(isAuthenticated, upload.single("image"), uploadProfileImage);

//UPLOAD OR CHANGE COVER PHOTO
router
  .route("/changeCover")
  .post(isAuthenticated, upload.single("cover"), uploadCoverImage);

//UPDATE PASSWORD
router
  .route("/updatePassword")
  .post(isAuthenticated, validateUser("updatePassword"), updatePassword);

//RESET PASSWORD
router
  .route("/resetPassword")
  .post(validateUser("resetPassword"), resetPassword);
//CHECK OTP AND CREATE NEW PASSWORD
router
  .route("/resetPassword/:id")
  .post(validateUser("checkotp"), checkOtp)
  .put(validateUser("newPassword"), crateNewPassword);

//FOLLOW UNFOLLOW USER
router
  .route("/:id")
  .post(isAuthenticated, followUnfollowUser)
  .get(isAuthenticated, viewOthersProfile);

module.exports = router;
