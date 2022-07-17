const User = require('../models/User');

var ObjectId = require('mongoose').Types.ObjectId;

exports.updateStatus = async (req, res) => {
    let errors = {};
    try{
        const { action, user_id } = req.body;
        //Validate Object ID
        if (!ObjectId.isValid(user_id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid post"
            });
        }
        // dangerouslyDisableDefaultSrc;
        const user = await User.findById(user_id);
        if(!user){
            return res.stutus(401).json({
                succes: false,
                message: "User not found"
            })
        }

        user.account_status = action;
        await user.save();

        return res.status(200).json({
            success: true,
            user,
            message: "User status updated successfully"
        })

    }catch(error){
        console.log(error);
        errors.general = error.message
        return res.status(500).json({
            success: false,
            message: errors,
        })
    }
}