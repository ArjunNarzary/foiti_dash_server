const TripPlan = require("../models/TripPlan");

var ObjectId = require("mongoose").Types.ObjectId;


exports.getAllTripPlans = async (req, res) => {
    let errors = {}
    try {
        const plans = await TripPlan.find({})
            .populate('user_id', '_id name email gender dob bio meetup_reason interests education occupation languages movies_books_music')
            .sort({ createdAt: -1 });

        res.status(200).json({
            plans,
            success: true
        })

    } catch (error) {
        console.log(error);
        errors.general = error.message;
        res.status(500).json({
            succes: false,
            message: errors,
        })
    }
}

exports.updateTripPlanStatus = async (req, res) => {
    const errors = {};
    try{

        const { plan_id } = req.params;
        const { action } = req.body;

        //Validate Object ID
        if (!ObjectId.isValid(plan_id)) {
            errors.general = "Invalid trip plan";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        const status = ["silent", "active", "terminated"];
        if(!status.includes(action)){
            errors.general = "Invalid action";
            return res.status(401).json({
                success: false,
                message: errors
            })
        }

        const plan = await TripPlan.findById(plan_id);
        if(!plan){
            errors.general = "Trip plan not found";
            return res.status(401).json({
                success: false,
                message: errors
            })
        }

        plan.status = action;
        await plan.save();

        return res.status(200).json({
            success: true,
            plan
        })

    }catch(error){
        console.log(error);
        errors.general = error.message;
        res.status(500).json({
            success: false,
            message: errors
        })
    }
}