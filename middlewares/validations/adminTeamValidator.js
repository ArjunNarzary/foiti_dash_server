const { body } = require("express-validator");

exports.validateTeam = (method) => {
    switch (method) {

        //LOGIN USER
        case "loginTeam": {
            return [
                body("username")
                    .trim()
                    .exists({ checkFalsy: true })
                    .withMessage("Please provide email address or username")
                    .bail(),
                body("password")
                    .trim()
                    .exists({ checkFalsy: true })
                    .withMessage("Please enter your password")
                    .bail(),
            ];
        }

        //Validate Name
        case "validateName": {
            return [
                body("name")
                    .trim()
                    .exists({ checkFalsy: true })
                    .withMessage("Please enter your name")
                    .isLength({ min: 4 })
                    .withMessage("Name must contain atlest 4 character")
                    .bail(),
            ];
        }

        //Validate Username
        case "validateUsername": {
            return [
                body("username")
                    .trim()
                    .exists({ checkFalsy: true })
                    .withMessage("Please enter your username")
                    .isLength({ min: 5 })
                    .withMessage("Username must contain atlest 5 character")
                    .isLength({ max: 30 })
                    .withMessage("Username must be less than 30 characters")
                    .custom((value) => /^[a-zA-Z0-9._]*$/.test(value))
                    .withMessage("Only alphanumeric characters and . _ are allowed")
                    .bail(),
            ];
        }

        case "validateEmail": {
            return [
                body("email")
                    .trim()
                    .exists({ checkFalsy: true })
                    .withMessage("Please enter your email")
                    .isEmail()
                    .withMessage("Please provide valid email address")
                    .bail(),
            ];
        }

        case "validatePhone": {
            return [
                body("phoneNumber")
                    .trim()
                    .exists({ checkFalsy: true })
                    .withMessage("Please enter a phone number")
                    .isLength({ max: 10, min: 10 })
                    .withMessage("Please enter a valid phone number without spaces")
                    .custom((value) => !/\s/.test(value))
                    .withMessage("No spaces are allowed in phone number")
                    .bail(),
                // body("code")
                //   .trim()
                //   .exists({ checkFalsy: true })
                //   .withMessage("Please select country code")
                //   .bail(),
            ];
        }

        //Edit Profile
        case "editProfile": {
            return [
                body("name")
                    .trim()
                    .exists({ checkFalsy: true })
                    .withMessage("Please enter your name")
                    .isLength({ min: 4 })
                    .withMessage("Name must contain atleat 4 characters")
                    .isLength({ max: 30 })
                    .withMessage("Name must be less than 30 characters")
                    .bail(),
                // body("username")
                //   .trim()
                //   .exists({ checkFalsy: true })
                //   .withMessage("Please enter your username")
                //   .isLength({ min: 5 })
                //   .withMessage("Username must contain atlest 5 character")
                //   .custom((value) => !/\s/.test(value))
                //   .withMessage("No spaces are allowed in the username")
                //   .bail(),
                body("bio")
                    .isLength({ max: 200 })
                    .withMessage("Please enter your bio within 200 characters")
                    .optional({ nullable: true })
                    .bail(),
                body("website")
                    .trim()
                    .optional({ nullable: true, checkFalsy: true })
                    .if((value) => value !== null)
                    .isURL()
                    .withMessage("Please enter valid url")
                    .isLength({ max: 50 })
                    .withMessage("Please enter your website within 50 characters")
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
                    .bail()
                    .custom((val, { req }) => {
                        if (val == req.body.currentPassword) {
                            return Promise.reject(
                                "Current password can't be same as new password"
                            );
                        }
                        return true;
                    }),
                body("confirmPassword")
                    .exists({ checkFalsy: true })
                    .withMessage("Please enter confirm password")
                    .bail()
                    .custom((val, { req }) => {
                        if (val !== req.body.newPassword) {
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
