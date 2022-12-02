const { json } = require("express");
const { validationResult } = require("express-validator");
const CustomType = require("../models/CustomType");
var ObjectId = require("mongoose").Types.ObjectId;

function createError(errors, validate) {
    const arrError = validate.array();
    errors[arrError[0].param] = arrError[0].msg;
    return errors;
}


//Add new type
exports.addType = async (req, res) => {
    let errors = {};
    try{
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: createError(errors, validate),
            });
        }
        const { display_type, type, category } = req.body;

        const isTypeExist = await CustomType.findOne({ type: type.toLowerCase() });
        if(isTypeExist){
            errors.type = `${type} has already been added`;
            return res.status(400).json({
                success: false,
                message: errors,
            })
        }

        const newType = await CustomType.create({ display_type, type: type.toLowerCase(), category });

        return res.status(200).json({
            success: true,
            newType,
        })

    }catch(error){
        console.log(error);
        errors.general = error.message;
        return res.status(500).json({
            success: false,
            errors
        })
    }
}

//GET ALL TYPES
exports.getAllType = async (req, res) => {
    let errors = {};
    try{
        const types = await CustomType.find().sort({ type: 1 });
        
        return res.status(200).json({
            success: true,
            types,
        })
    }catch(error){
        console.log(error);
        errors.general = error.message;
        json({
            success: false,
            errors
        })
    }
}

//Edit TYPE
exports.editType = async (req, res) => {
    let errors = {};
    try{
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: createError(errors, validate),
            });
        }

        const { type_id } = req.params;
        const { display_type, type, category } = req.body;

        //Validate Object ID
        if (!ObjectId.isValid(type_id)) {
            errors.general = "Invalid type";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        const getType = await CustomType.findById(type_id);
        if(!getType){
            errors.general = "Type not found";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }


        const isTypeExist = await CustomType.findOne({ type: type.toLowerCase() }).where('_id').ne(type_id);
        if (isTypeExist) {
            errors.type = `${type} has already been added`;
            return res.status(400).json({
                success: false,
                message: errors,
            })
        }

        getType.display_type = display_type;
        getType.type = type.toLowerCase();
        getType.category = category;
        await getType.save();

        return res.status(200).json({
            success: true,
            getType,
        })

    }catch(error){
        console.log(error);
        errors.general = error.message;
        return res.status(500).json({
            success: false,
            errors
        })
    }
}

//DELETE TYPE
exports.deleteType = async (req, res) => {
    let errors = {};
    try{
        const { type_id } = req.params;

        //Validate Object ID
        if (!ObjectId.isValid(type_id)) {
            errors.general = "Invalid type";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        const getType = await CustomType.findById(type_id);
        if(!getType){
            errors.general = "Type not found";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        await getType.remove();
        return res.status(200).json({
            success: true,
            message: "Type deleted successfully"
        });

    }catch(error){
        console.log(error);
        errors.general = error.message;
        return res.status(500).json({
            success: false,
            errors
        })
    }
}