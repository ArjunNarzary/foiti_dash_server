const Contribution = require('../models/Contribution');
const User = require('../models/User');

var ObjectId = require('mongoose').Types.ObjectId;

//View all Users
exports.allUsers = async (req, res) => {
    let errors = {};
    try{
        const users = await User.find({})
            .select("_id name email email_verified address place formattedAddress total_contribution follower following account_status createdAt")
            .populate("place", "_id address name display_name display_address display_address_available")
            .sort({createdAt: -1});


        users.forEach(user => {
            if(user?.place?._id){
                user.formattedAddress = user.place.display_address_to_show_on_user
            }else{
                let address = "";
                let addressArr = [];
                if(user?.address?.name){
                    addressArr.push(user?.address?.name)
                }

                if (user?.address?.administrative_area_level_1 && 
                    (user?.address?.name != user?.address?.administrative_area_level_1)){
                    addressArr.push(user?.address?.administrative_area_level_1)
                }

                if (addressArr.length > 0){
                    address = addressArr.join(", ");
                }

                user.formattedAddress = address;
            }
        });

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

//Update hidden meetup profile status 
exports.updateHiddenMeetupProfile = async (req, res) => {
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

        if(action == "true"){
            user.hidden_meetup_profile = true;
        }else{
            user.hidden_meetup_profile = false;
        }
        await user.save();

        return res.status(200).json({
            success: true,
            user,
            message: "User hidden meetup profile updated successfully"
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