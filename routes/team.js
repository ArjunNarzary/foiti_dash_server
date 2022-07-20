const express = require("express");
const { validateTeam } = require("../middlewares/validations/adminTeamValidator");
const { registerTeam, loginTeam, refreshToken, dashboard, logoutTeam, test, updatePassword } = require("../controllers/team");
const { isAuthenticatedAdmin } = require("../middlewares/auth");
const router = express.Router();

//REGISTER USER
router.route("/register").post(registerTeam);
router.route("/test").get(test);
//LOGIN USER
router.route("/login").post(validateTeam("loginTeam"), loginTeam);
router.route("/updatePassword").post(isAuthenticatedAdmin, validateTeam("updatePassword"), updatePassword);
//LOGOUT USER
router.route("/logout").get(logoutTeam);
//TEST AUTH
router.route("/dashboard").get(isAuthenticatedAdmin, dashboard);
//REFRESH TOKEN
router.route("/refresh_token").post(refreshToken);


module.exports = router;