const Contribution = require('../models/Contribution');
const User = require('../models/User');

var ObjectId = require('mongoose').Types.ObjectId;

//View all Users
exports.allUsers = async (req, res) => {
    let errors = {};
    try{
        const users = await User.find({}).sort({createdAt: -1});
        return res.status(200).json({
            success: true,
            users,
            message: "All users fetched successfully"
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

exports.recalculateContribution = async (req, res) => {
    let errors = {};
    try{
        const { user_id } = req.body;
        //Validate Object ID
        if (!ObjectId.isValid(user_id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid post"
            });
        }

        const user = await User.findById(user_id);
        if(!user){
            return res.stutus(401).json({
                succes: false,
                message: "User not found"
            })
        }

        //FIND CONTRIBUTION
        const contribution = await Contribution.findOne({userId: user_id});
        let contributionPoints = 0;
        if(contribution){
            contributionPoints = contribution.calculateTotalContribution();
        }

        user.total_contribution = contributionPoints;
        await user.save();

        return res.status(200).json({
            success: true,
            user,
            message: "User contribution updated successfully"
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


//Total Users

exports.totalUsers = async (req, res) => {
    let errors = {}
    try{
        const totalUsers = await User.countDocuments();

        res.status(200).json({
            totalUsers
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