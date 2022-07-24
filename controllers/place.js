const Place = require("../models/Place");
const Post = require("../models/Post");
var ObjectId = require("mongoose").Types.ObjectId;


exports.allPlaces = async (req, res) => {
    let  errors ={};
    try{
        const places = await Place.find({}).sort({updatedAt: -1});

        res.status(200).json({
            places,
            success: true,
            message: "All places"
        });
    }catch(error){
        console.log(error);
        errors.general = error.message;
        res.status(400).json({
            success: false,
            message: errors
        });
    }
}


exports.getPlace = async (req, res) => {
    let errors = {};
    try{
        const { place_id } = req.params;

        //Validate place_id
        if(!ObjectId.isValid(place_id)){
            errors.general = "Invalid place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        const place = await Place.findById(place_id);
        if(!place){
            errors.general = "Place not found";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        return res.status(200).json({
            place,
            success: true,
            message: "Place found"
        });

    }catch(error){
        console.log(error);
        errors.general = error.message;
        res.status(400).json({
            success: false,
            message: errors
        });
    }
}

exports.changeName = async (req, res) => {
    let errors = {};
    try{
        const { place_id } = req.params;
        const { name } = req.body;
        // return;

        //Validate place_id
        if (!ObjectId.isValid(place_id)) {
            errors.general = "Invalid place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        //Validate name
        if(!name.trim()){
            errors.name = "Please enter a name";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        //GET PLACE
        const place = await Place.findById(place_id);
        if(!place){
            errors.general = "Place not found";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        //UPDATE PLACE
        place.name = name;
        //UPDATE ALL POST NAME
        await Post.updateMany({ "place": place._id }, { "$set": { "name": name } });
        await place.save();

        res.status(200).json({
            success: true,
            message: "Place name updated",
            place
        });

    }catch(error){
        console.log(error);
        errors.general = error.message;
        res.status(400).json({
            success: false,
            message: errors
        });
    }
}

//Update Coordinates
exports.updateCoors = async (req, res) => {
    let errors = {};
    try {
        const { place_id } = req.params;
        const { lat, lng } = req.body;

        //Validate Object ID
        if (!ObjectId.isValid(place_id)) {
            errors.general = "Invalid place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        if (lat == "" || lat == undefined) {
            errors.lat = "Please enter latitude";
            return res.status(401).json({
                success: false,
                message: errors,
            });
        }

        if (lng == "" || lng == undefined) {
            errors.lng = "Please enter longitude";
            return res.status(401).json({
                success: false,
                message: errors,
            });
        }

        const place = await Place.findById(place_id);
        if (!place) {
            errors.general = "Place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        place.coordinates.lat = lat;
        place.coordinates.lng = lng;
        await place.save();

        return res.status(200).json({
            success: true,
            message: "Coordinates updated successful",
            place,
        });
    } catch (error) {
        console.log(error);
        errors.general = error.message;
        res.status(500).json({
            success: false,
            message: errors,
        });
    }
};