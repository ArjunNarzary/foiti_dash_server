const Place = require("../models/Place");
const Post = require("../models/Post");
var ObjectId = require("mongoose").Types.ObjectId;
const sharp = require("sharp");
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
const { uploadFile, deleteFile } = require("../utils/s3");
const Contribution = require("../models/Contribution");
const PlaceAddedBy = require("../models/PlaceAddedBy");
const User = require("../models/User");


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

        const place = await Place.findById(place_id)
                    .populate("original_place_id")
                    .populate("duplicate_place_id", "_id name");
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
        const place = await Place.findById(place_id)
                    .populate("original_place_id")
                    .populate("duplicate_place_id", "_id name");
        if(!place){
            errors.general = "Place not found";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        //UPDATE PLACE
        place.name = name;
        place.reviewed_status = true;
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

        const place = await Place.findById(place_id)
                    .populate("original_place_id")
                    .populate("duplicate_place_id", "_id name");
        if (!place) {
            errors.general = "Place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        place.coordinates.lat = lat;
        place.coordinates.lng = lng;
        place.reviewed_status = true;
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

//CHNAGE ADDRESS
exports.changeAddress = async (req, res) => {
    let errors = {};
    try {
        const { place_id } = req.params;
        const { address } = req.body;

        //Validate Object ID
        if (!ObjectId.isValid(place_id)) {
            errors.general = "Invalid place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        const place = await Place.findById(place_id)
                    .populate("original_place_id")
                    .populate("duplicate_place_id", "_id name");
        if (!place) {
            errors.general = "Place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        //Validate address
        let isObject = Array.isArray(Object.keys(address));
        if(!isObject){
            errors.address = "Please enter an address";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        //Check if short country is added
        if (address.country.trim() && !address.short_country.trim()) {
            errors.property = "Please add a short country";
            return res.status(401).json({
                success: false,
                message: errors,
            });
        }

        place.address = address;
        place.reviewed_status = true;
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
}

//CHNAGE DISPLAY ADDRESS
exports.changeDisplayAddress = async (req, res) => {
    let errors = {};
    try {
        const { place_id } = req.params;
        const { address } = req.body;

        //Validate Object ID
        if (!ObjectId.isValid(place_id)) {
            errors.general = "Invalid place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        const place = await Place.findById(place_id)
                    .populate("original_place_id")
                    .populate("duplicate_place_id", "_id name");
        if (!place) {
            errors.general = "Place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        //Validate address
        let isObject = Array.isArray(Object.keys(address));
        if (!isObject) {
            errors.address = "Please enter an address";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        if (
            !address?.locality &&
            !address?.admin_area_2 &&
            !address?.admin_area_1 &&
            !address?.country
        ){
            errors.address = "Please enter atleast 1 address";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        place.display_address = address;
        place.display_address_available = true;
        place.reviewed_status = true;
        await place.save();

        //UPDATE DISPLAY ADDRESS OF ALL DUPLICTE PLACES IF DUPLICATE EXIST 
        if (place.duplicate_place_id.length > 0){
            await Place.updateMany({ _id: {$in: place.duplicate_place_id} }, { 
                display_address: address,
                display_address_available: true,
                reviewed_status: true,
             });
        }

        return res.status(200).json({
            success: true,
            message: "Display address updated successful",
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
}

//MERGE DISPLAY ADDRESS WITH ADDRESS
exports.mergeDisplayAddress = async (req, res) => {
    let errors = {};
    try {
        const { place_id } = req.params;

        //Validate Object ID
        if (!ObjectId.isValid(place_id)) {
            errors.general = "Invalid place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        const place = await Place.findById(place_id)
                    .populate("original_place_id")
                    .populate("duplicate_place_id", "_id name");

        if (!place) {
            errors.general = "Place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        const address = {
            admin_area_2: place.address.administrative_area_level_2,
            admin_area_1: place.address.administrative_area_level_1,
            country: place.address.country,
        }

        place.display_address = address;
        place.display_address_available = true;
        place.reviewed_status = true;
        await place.save();

        //UPDATE DISPLAY ADDRESS OF ALL DUPLICTE PLACES IF DUPLICATE EXIST 
        if (place.duplicate_place_id.length > 0){
            await Place.updateMany({ _id: {$in: place.duplicate_place_id} }, { 
                display_address: address,
                display_address_available: true,
                reviewed_status: true,
             });
        }

        return res.status(200).json({
            success: true,
            message: "Display address updated successful",
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
}

//ADD CUSTOM TYPES
exports.addEditCustomType = async (req, res) => {
    let errors = {};
    try {
        const { place_id } = req.params;
        const { types } = req.body;

        //Validate Object ID
        if (!ObjectId.isValid(place_id)) {
            errors.general = "Invalid place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        const place = await Place.findById(place_id)
            .populate("original_place_id")
            .populate("duplicate_place_id", "_id name");
        if (!place) {
            errors.general = "Place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        //Validate address
        let isArray = Array.isArray(types);
        if (!isArray || types.length == 0) {
            errors.type = "Please add atlest 1 custom types";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        place.types = types;
        place.reviewed_status = true;
        await place.save();

        return res.status(200).json({
            success: true,
            message: "Custom types updated successful",
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
}


//ADD EDIT ALIAS
exports.addEditAlias = async (req, res) => {
    let errors = {};
    try{
        const { place_id } = req.params;
        const { alias } = req.body;

        //Validate Object ID
        if (!ObjectId.isValid(place_id)) {
            errors.general = "Invalid place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        const place = await Place.findById(place_id)
                    .populate("original_place_id")
                    .populate("duplicate_place_id", "_id name");;
        if (!place) {
            errors.general = "Place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        //Validate address
        let isArray = Array.isArray(alias);
        if (!isArray || alias.length == 0) {
            errors.alias = "Please add atlest 1 alias";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        place.alias = alias;
        place.reviewed_status = true;
        await place.save();

        return res.status(200).json({
            success: true,
            message: "Custom types updated successful",
            place,
        });
    }catch(error){
        console.log(error);
        errors.general = error.message;
        res.status(500).json({
            success: false,
            message: errors,
        });
    }
}


//UPDATE SEARCH RANK
exports.setSearchRank = async (req, res) => {
    let errors = {};
    try{
        const { place_id } = req.params;
        const { rank } = req.body;

        //Validate Object ID
        if (!ObjectId.isValid(place_id)) {
            errors.general = "Invalid place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        if(rank.trim() == "" || !Number.isInteger(Number(rank))){
            errors.rank = "Please enter valid rank without decimals";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        const place = await Place.findById(place_id)
                    .populate("original_place_id")
                    .populate("duplicate_place_id", "_id name");

        if (!place) {
            errors.general = "Place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        place.search_rank = Number(rank);
        place.reviewed_status = true;
        await place.save();

        return res.status(200).json({
            success: true,
            message: "Search rank updated successful",
            place,
        });
    }catch(error){
        console.log(error);
        errors.general = error.message;
        res.status(500).json({
            success: false,
            message: errors,
        });
    }
}

//UPDATE EDITOR RATING
exports.setEditorRating = async (req, res) => {
    let errors = {};
    try {
        const { place_id } = req.params;
        const { rating } = req.body;

        //Validate Object ID
        if (!ObjectId.isValid(place_id)) {
            errors.general = "Invalid place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        if (rating.trim() == "" || Number.isNaN(Number(rating))) {
            errors.rank = "Please enter valid rating";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        const place = await Place.findById(place_id)
            .populate("original_place_id")
            .populate("duplicate_place_id", "_id name");

        if (!place) {
            errors.general = "Place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        place.editor_rating = Number(rating);
        place.reviewed_status = true;
        await place.save();

        return res.status(200).json({
            success: true,
            message: "Search rank updated successful",
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
}


//SEARCH PLACE
exports.searchPlace = async (req, res) => {
    //Search places while adding location of post
    try {
        const { place, count } = req.query;
        const trimedPlace = place.trim();

        const results = await Place.find({
            $or: [{ name: { $regex: `${trimedPlace}`, $options: "i" } }, { alias: { $regex: `${trimedPlace}`, $options: "i" } }]
        })
            .where("duplicate")
            .ne(true)
            .select(
                "_id name address cover_photo short_address local_address types google_types alias display_address display_address_available"
            )
            .limit(count);

        return res.status(200).json({
            success: true,
            results,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}

exports.setOriginalPlace = async (req, res) => {
    let errors = {};
    try {
        const { place_id } = req.params;
        const { original_place_id } = req.body;

        //Validate Object ID
        if (!ObjectId.isValid(place_id)) {
            errors.general = "Invalid place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }
        if (!ObjectId.isValid(original_place_id)) {
            errors.general = "Invalid original place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        //SAME PLACE IDS
        if(place_id == original_place_id){
            errors.general = "Place and original place cannot be same";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        const currentPlace = await Place.findById(place_id);
        if (!currentPlace) {
            errors.general = "Place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        //CHECK IF IS ORIGINAL PLACE
        if (currentPlace.duplicate_place_id.length > 0){
            errors.general = "Currunt place is original place of other places";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }
        const originalPlace = await Place.findById(original_place_id);
        if (!originalPlace) {
            errors.general = "Original place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        //IF ALREADY HAS ORIGIN PLACE
        if (currentPlace.original_place_id){
            const oldOriginalPlace = await Place.findById(currentPlace.original_place_id);
            if (oldOriginalPlace && oldOriginalPlace.duplicate_place_id.includes(currentPlace._id)) {
                const index = oldOriginalPlace.duplicate_place_id.indexOf(currentPlace._id);
                oldOriginalPlace.duplicate_place_id.splice(index, 1);
            }
            await oldOriginalPlace.save();
        }

        if(originalPlace.display_address_available){
            currentPlace.display_address = originalPlace.display_address;
            currentPlace.display_address_available = true;
        }

        currentPlace.original_place_id = originalPlace._id;
        currentPlace.duplicate = true;
        currentPlace.reviewed_status = true;
        
        if (!originalPlace.duplicate_place_id.includes(currentPlace._id)) {
            originalPlace.duplicate_place_id.push(currentPlace._id);
        }
        originalPlace.reviewed_status = true;
        await originalPlace.save();
        await currentPlace.save();

        //REMOVE CONTRIBUTIONS FOR CURRENT PLACE
        const placeCreated = await PlaceAddedBy.findOne({
            place: currentPlace._id,
        });

        //REMOVE CONTRIBUITION FROM THE USER WHO CREATED THE PLACE
        if(placeCreated){
            const placeCreator = await User.findById(placeCreated.user);
            //REMOVE PLACE FROM CONTRIBUTION TABLE
            const contribution = await Contribution.findOne({
                userId: placeCreator._id,
            });
            if (contribution.added_places.includes(currentPlace._id)) {
                const index = contribution.added_places.indexOf(currentPlace._id);
                contribution.added_places.splice(index, 1);
                await contribution.save();
            }
            if (placeCreator) {
                placeCreator.total_contribution =
                    contribution.calculateTotalContribution();
                await placeCreator.save();
            }
        }

        const place = await Place.findById(place_id)
                    .populate("original_place_id")
                    .populate("duplicate_place_id", "_id name");

        return res.status(200).json({
            success: true,
            message: "Original place set successful",
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
}

exports.deleteOriginalPlace = async (req, res) => {
    let errors = {};
    try {
        const { place_id } = req.params;
        const { duplicate_id } = req.body;


        //Validate Object ID
        if (!ObjectId.isValid(place_id)) {
            errors.general = "Invalid place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }
        if (!ObjectId.isValid(duplicate_id)) {
            errors.general = "Invalid original place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        //SAME PLACE IDS
        if (place_id == duplicate_id){
            errors.general = "Original place and duplicate place cannot be same";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }
        const originalPlace = await Place.findById(place_id);
        if (!originalPlace) {
            errors.general = "Original place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }
        const duplicatePlace = await Place.findById(duplicate_id)
        if (!duplicatePlace) {
            errors.general = "Duplicate place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }
        if (originalPlace.duplicate_place_id.includes(duplicatePlace._id)) {
            const index = originalPlace.duplicate_place_id.indexOf(duplicatePlace._id);
            originalPlace.duplicate_place_id.splice(index, 1);

            duplicatePlace.duplicate = false;
            duplicatePlace.original_place_id = undefined;
            duplicatePlace.display_address={};
            duplicatePlace.display_address_available = false;
            await duplicatePlace.save();
            await originalPlace.save();
        }

        const place = await Place.findById(place_id)
                    .populate("original_place_id")
                    .populate("duplicate_place_id", "_id name");

        return res.status(200).json({
            success: true,
            message: "Duplicate place removed successful",
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
}


//TOGGLE SHOW DESTINATION
exports.toggleShowDestination = async (req, res) => {
    let errors = {};
    try {
        const { place_id } = req.params;

        //Validate Object ID
        if (!ObjectId.isValid(place_id)) {
            errors.general = "Invalid place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }
        const place = await Place.findById(place_id)
                    .populate("original_place_id")
                    .populate("duplicate_place_id", "_id name");;
        if (!place) {
            errors.general = "Place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        if(place.types.length < 2){
            errors.general = "Place must have atleast 2 types";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        if(place.types[1] != "state"){
            errors.general = "Place must be state";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }
        place.show_destinations = !place.show_destinations;
        await place.save();

        return res.status(200).json({
            success: true,
            message: "Show destination set successful",
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
}

//TOGGLE SHOW DESTINATION
exports.toggleDestination = async (req, res) => {
    let errors = {};
    try {
        const { place_id } = req.params;

        //Validate Object ID
        if (!ObjectId.isValid(place_id)) {
            errors.general = "Invalid place";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }
        const place = await Place.findById(place_id)
            .populate("original_place_id")
            .populate("duplicate_place_id", "_id name");;
        if (!place) {
            errors.general = "Place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        place.destination = !place.destination;
        await place.save();

        return res.status(200).json({
            success: true,
            message: "Show destination set successful",
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
}

//CHNAGE COVER PHOTO
exports.changeCover = async (req, res) => {
    let errors = {};
    try {
        const { place_id } = req.params;

        //Validate Object ID
        if (!ObjectId.isValid(place_id)) {
            errors.general = "Invalid place";
            await unlinkFile(req.file.path);
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }
        const place = await Place.findById(place_id)
            .populate("original_place_id")
            .populate("duplicate_place_id", "_id name")
            .populate("posts");
        if (!place) {
            errors.general = "Place not found";
            await unlinkFile(req.file.path);
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        let coverPhotoOfPost = false;
        if (place.cover_photo.large != undefined && place.posts.length > 0){
            place.posts.forEach(post => {
                if(place.cover_photo.large.private_id == post.content[0].image.large.private_id){
                    coverPhotoOfPost = true;
                    return false;
                }
            } );
        }

        //RESIZE COVER PHOTO
        const sharpLarge = await sharp(req.file.path)
            .resize(1080)
            .withMetadata()
            .toBuffer();
        const resultLarge = await uploadFile(req.file, sharpLarge);

        //Resize Image for thumbnail
        const sharpThumb = await sharp(req.file.path)
            .resize(500)
            .withMetadata()
            .toBuffer();
        const resultThumb = await uploadFile(req.file, sharpThumb);

        //Resize Image for small
        const sharpSmall = await sharp(req.file.path)
            .resize(150, 150, { fit: "cover" })
            .withMetadata()
            .toBuffer();
        const resultSmall = await uploadFile(req.file, sharpSmall);

        //REMOVE image from S3 if cover photo is not same with any post photo
        if (!coverPhotoOfPost && place.cover_photo.large != undefined) {
            await deleteFile(place.cover_photo.large.private_id);
            await deleteFile(place.cover_photo.thumbnail.private_id);
            await deleteFile(place.cover_photo.small.private_id);
        }

        //SAVE NEW COVER PHOTO
        const newCoverPhoto = {
            thumbnail: {
                public_url: resultThumb.Location,
                private_id: resultThumb.Key,
            },
            small: {
                public_url: resultSmall.Location,
                private_id: resultSmall.Key,
            },
            large: {
                public_url: resultLarge.Location,
                private_id: resultLarge.Key,
            },
        }

        place.cover_photo = newCoverPhoto;
        place.reviewed_status = true;
        await place.save();

        //REMOVE FILE FROM UPLOAD FOLDER
        await unlinkFile(req.file.path);

        return res.status(200).json({
            success: true,
            message: "Cover photo set successful",
            place,
        });
    } catch (error) {
        console.log(error);
        await unlinkFile(req.file.path);
        errors.general = error.message;
        res.status(500).json({
            success: false,
            message: errors,
        });
    }
}