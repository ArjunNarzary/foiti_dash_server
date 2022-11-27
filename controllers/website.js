const Place = require("../models/Place");
const Post = require("../models/Post");
const User = require("../models/User");

var ObjectId = require("mongoose").Types.ObjectId;

exports.getPost = async (req, res) => {
    const  errors = {};
    try{
        const { post_id } = req.params;
        if(!post_id){
            errors.general = "Invalid post id";
            res.status(500).json({
                success: false,
                message: errors
            })
        }

        //Validate Object ID
        if (!ObjectId.isValid(post_id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid post",
            });
        }

        const post = await Post.findById(post_id)
            .select("_id place user name content caption")
            .populate("place", "name ")
            .populate("user", "name");

        if (!post) {
            errors.general = "Post not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        return res.status(200).json({
            success: true,
            post,
        });



    }catch(error){
        console.log(error);
        errors.general = error.message;
        res.status(500).json({
            success: false,
            message: errors
        })
    }
};

exports.getPlace = async (req, res) => {
    const errors = {};
    try {
        const { place_id } = req.params;
        if (!place_id) {
            errors.general = "Invalid place id";
            res.status(500).json({
                success: false,
                message: errors
            })
        }

        //Validate Object ID
        if (!ObjectId.isValid(place_id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid place id",
            });
        }

        const place = await Place.findById(place_id)
            .select("_id name display_name cover_photo types display_address_available display_address address short_address local_address")

        place.short_address = place.display_address_for_share;
        //added formated type below as local_adderss
        place.local_address = place.types.length > 1 ? place.types[1].split("_").map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(" ") : "";

        if (!place) {
            errors.general = "Place not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        return res.status(200).json({
            success: true,
            place,
        });



    } catch (error) {
        console.log(error);
        errors.general = error.message;
        res.status(500).json({
            success: false,
            message: errors
        })
    }
};

exports.getUser = async (req, res) => {
    const errors = {};
    try {
        const { user_id } = req.params;
        if (!user_id) {
            errors.general = "Invalid user id";
            res.status(500).json({
                success: false,
                message: errors
            })
        }

        //Validate Object ID
        if (!ObjectId.isValid(user_id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user id",
            });
        }

        const user = await User.findById(user_id)
            .select("_id name profileImage total_contribution");

        if (!user) {
            errors.general = "User not found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        //COUNT TOTAL POST UPLOADS
        let posts = await Post.find({ user: user._id }).populate("place");

        const totalPosts = posts.length;

        //Unique Place
        let helpNavigate = 0;
        const totalPlaces = posts.map((post) => {
            if (post.location_viewers_count != undefined) {
                helpNavigate = helpNavigate + post.location_viewers_count;
            }
            if (post.place.duplicate && post.place.original_place_id) {
                return post.place.original_place_id
            } else {
                return post.place._id;
            }
        });

        //COUNT HELPED NAVIGATE

        const uniquePlacesVisitedIds = new Set();
        totalPlaces.map((ele) => {
            uniquePlacesVisitedIds.add(ele.toString());
        })


        // const uniquePlacesVisited = [...new Set(totalPlaces.toString())];
        const uniquePlacesVisited = [...uniquePlacesVisitedIds];
        const placesVisited = uniquePlacesVisited.length;

        return res.status(200).json({
            success: true,
            user,
            placesVisited
        });



    } catch (error) {
        console.log(error);
        errors.general = error.message;
        res.status(500).json({
            success: false,
            message: errors
        })
    }
};
