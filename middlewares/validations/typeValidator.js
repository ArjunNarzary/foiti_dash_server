const { body } = require("express-validator");

exports.validateType = (method) => {
    switch (method) {
        //ADD NEW TYPE
        case "addType": {
            return [
                body("display_type")
                .trim()
                .exists({ checkFalsy: true })
                .withMessage("Please enter display type")
                .bail(),
                body("type")
                .trim()
                .exists({ checkFalsy: true })
                .withMessage("Please enter type")
                .custom((value) => /^[a-zA-Z0-9_]*$/.test(value))
                .withMessage("Only alphanumeric characters and _ are allowed")
                .bail(),
            ]
        }
    }
}