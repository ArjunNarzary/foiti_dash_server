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
            return User.findOne({ email: val }).then((user) => {
              if (user) {
                return Promise.reject("Email already exist");
              }
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
  }
};
