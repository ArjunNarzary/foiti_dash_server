const express = require("express");
const { addType, getAllType, editType, deleteType } = require("../controllers/type");
const { isAuthenticatedAdmin } = require("../middlewares/auth");
const { validateType } = require("../middlewares/validations/typeValidator");

const router = express.Router();

//Add new type
router.route("/").post(isAuthenticatedAdmin, validateType("addType"), addType)
                .get(isAuthenticatedAdmin, getAllType);

router.route("/:type_id").put(isAuthenticatedAdmin, validateType("addType"), editType)
                         .delete(isAuthenticatedAdmin, deleteType);

module.exports = router;
