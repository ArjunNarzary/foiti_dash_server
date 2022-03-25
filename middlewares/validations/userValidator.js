const { body } = require("express-validator");
const User = require("../../models/User");

exports.validateUser = (method) => {
  switch (method) {
    //REGISTER USER
    case "createUser": {
      return [
        body("email")
          .exists({ checkFalsy: true })
          .withMessage("Please provide email address")
          .isEmail()
          .withMessage("Please provide valid email address")
          .bail()
          .custom(async (val) => {
            return await User.findOne({ email: val }).then((user) => {
              if (user) {
                return Promise.reject("Email already exist");
              }
              return true;
            });
          }),
        body("password")
          .trim()
          .exists({ checkFalsy: true })
          .withMessage("Please enter your password")
          .isLength({ min: 8 })
          .withMessage("Password must be minimum 8 character")
          .bail(),
      ];
    }

    //LOGIN USER
    case "loginUser": {
      return [
        body("email")
          .exists({ checkFalsy: true })
          .withMessage("Please provide email address")
          .isEmail()
          .withMessage("Please provide valid email address")
          .bail(),
        body("password")
          .trim()
          .exists({ checkFalsy: true })
          .withMessage("Please enter your password")
          .bail(),
      ];
    }

    //Edit Profile
    case "editProfile": {
      return [
        body("name")
          .trim()
          .exists({ checkFalsy: true })
          .withMessage("Please enter your name")
          .bail(),
        body("username")
          .trim()
          .exists({ checkFalsy: true })
          .withMessage("Please enter your username")
          .isLength({ min: 5 })
          .withMessage("Username must contain atlest 5 character")
          .custom((value) => !/\s/.test(value))
          .withMessage("No spaces are allowed in the username")
          .bail(),
        body("bio")
          .isLength({ max: 1000 })
          .withMessage("Please enter your bio within 1000 characters")
          .optional({ nullable: true })
          .bail(),
        body("website")
          .trim()
          .isURL()
          .withMessage("Please enter valid url")
          .optional({ nullable: true })
          .bail(),
      ];
    }

    //UPDATE PASSWORD
    case "updatePassword": {
      return [
        body("currentPassword")
          .exists({ checkFalsy: true })
          .withMessage("Please enter your current password")
          .isLength({ min: 8 })
          .withMessage("Please enter valid password")
          .bail(),
        body("newPassword")
          .exists({ checkFalsy: true })
          .withMessage("Please enter new password")
          .isLength({ min: 8 })
          .withMessage("Password must be minimum 8 character")
          .bail(),
        body("confirmPassword")
          .exists({ checkFalsy: true })
          .withMessage("Please enter confirm password")
          .bail()
          .custom((val, { req }) => {
            if (val !== req.body.newPassword) {
              console.log("confirm");
              return Promise.reject(
                "Password confirmation does not match with new password"
              );
            }
            return true;
          }),
      ];
    }

    //RESET PASSWORD
    case "resetPassword": {
      return [
        body("email")
          .exists({ checkFalsy: true })
          .withMessage("Please provide email address")
          .isEmail()
          .withMessage("Please provide valid email address")
          .bail()
          .custom(async (val) => {
            return await User.findOne({ email: val }).then((user) => {
              if (!user) {
                return Promise.reject("This email is not registered with us");
              }
              return true;
            });
          }),
      ];
    }

    //Check OTP
    case "checkotp": {
      return [
        body("otp")
          .exists({ checkFalsy: true })
          .withMessage("Please enter otp")
          .isLength({ min: 6, max: 6 })
          .isNumeric()
          .withMessage("Please enter valide otp"),
      ];
    }

    //CREATE NEW PASSWORD
    case "newPassword": {
      return [
        body("password")
          .exists({ checkFalsy: true })
          .withMessage("Please enter new password")
          .isLength({ min: 8 })
          .withMessage("Password must be minimum 8 character")
          .bail(),
        body("confirmPassword")
          .exists({ checkFalsy: true })
          .withMessage("Please enter confirm password")
          .bail()
          .custom((val, { req }) => {
            if (val !== req.body.password) {
              console.log("confirm");
              return Promise.reject(
                "Password confirmation does not match with new password"
              );
            }
            return true;
          }),
      ];
    }
  }
};
