const Post = require("../models/Post");
const User = require("../models/User");
const Place = require("../models/Place");
const Contribution = require("../models/Contribution");
var ObjectId = require('mongoose').Types.ObjectId;


exports.usersPostCount = async(req, res) => {
    let errors ={};
    try{
        // const posts = await Post.aggregate({$and:[{disabled: false}, {terminated:false}]}).group({user: "$user"});
        const posts = await Post.aggregate([
            {
                $match: {
                    $and: [{ deactivated: false }, { terminated: false }]
                },
            },
            {
                $group: {
                    _id: "$user",
                    post_count: { $sum: 1 },
                }
            },
             {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            {
                $project: {
                    _id:1,
                    name: "$owner.name",
                    total_posts: "$post_count",
                    account_status: "$owner.account_status"
                }
            }
        ]);
        const activePosts = await Post.aggregate([
            {
                $match: {
                    $and:[{deactivated: false}, {terminated: false}]
                }
            },
            {
                $group: {
                    _id: {user: "$user", post_status: "$status"},
                    post_count: {$sum: 1},
                }
            },
            {
                $project:{
                    _id: "$_id.user",
                    total_posts: "$post_count",
                    post_status: "$_id.post_status"
                }
            },
        ]);

        posts.map((p) => {
            let total_active = 0;
            activePosts.map((ap) => {
                if(p._id.toString() === ap._id.toString() && ap.post_status === "active"){
                    total_active += ap.total_posts;
                }
            });
            p.total_active = total_active;
        });

        return res.status(200).json({
            success: true,
            posts
        })
        

    }catch(error){
        errors.general = "Something went wrong please try again";
        console.log(error);
        res.status(500).json({
            success:false,
            message: errors
        })
    }
}

exports.usersPost = async(req, res) => {
    let errors = {};
    try{
        const { user_id } = req.params;
        //Validate Object ID
        if (!ObjectId.isValid(user_id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid post"
            });
        }

        const posts = await Post.find({ user: user_id }).populate("place", "name address google_types").populate("user", "name");
        return res.status(200).json({
            success: true,
            posts
        })
        // console.log(user_id);
    }catch(error){
        console.log(error);
        errors.general = error.message;
        res.status(500).json({
            success: false,
            message: errors
        })
    }
}

exports.updatePostStatus = async(req, res) => {
    let errors ={};
    try{
        const { post_id } = req.params;
        const { action } = req.body;

        //Validate Object ID
        if (!ObjectId.isValid(post_id)) {
            errors.general = "Invalid post";
            return res.status(400).json({
                success: false,
                message: errors
            });
        }

        if(action == "" || action == undefined){
            errors.action = "Please select action type";
            return res.status(401).json({
                success: false,
                message: errors
            });
        }

        const post = await Post.findById(post_id);
        if(!post){
            errors.general = "Post not found";
            return res.status(404).json({
                success: false,
                message: errors
            })
        }

        post.status = action;
        await post.save();

        // console.log(post);
        return res.status(200).json({
            success: true,
            message: "Post updated successful"
        })
    }catch(error){
        console.log(error);
        errors.general =error.message;
        res.status(500).json({
            success: false,
            message:errors
        })
    }
}

//Update Coordinates
exports.updateCoors = async(req, res) => {
    let errors ={};
    try{
        const { post_id } = req.params;
        const { lat, lng } = req.body;

        //Validate Object ID
        if (!ObjectId.isValid(post_id)) {
            errors.general = "Invalid post";
            return res.status(400).json({
                success: false,
                message: errors
            });
        }

        if(lat == "" || lat == undefined){
            errors.lat = "Please enter latitude";
            return res.status(401).json({
                success: false,
                message: errors
            });
        }

        if(lng == "" || lng == undefined){
            errors.lng = "Please enter longitude";
            return res.status(401).json({
                success: false,
                message: errors
            });
        }

        const post = await Post.findById(post_id);
        if(!post){
            errors.general = "Post not found";
            return res.status(404).json({
                success: false,
                message: errors
            })
        }

        const cordStatus = post.coordinate_status

        post.content[0].coordinate.lat = lat;
        post.content[0].coordinate.lng = lng;
        post.coordinate_status = true;
        await post.save();

        if(!cordStatus){
            let contribution = await Contribution.findOne({ userId: post.user });
            if (!contribution) {
                contribution = await Contribution.create({
                    userId: post.user,
                });
            }

            contribution.photos_with_coordinates.push(post._id);
            await contribution.save();
        }

        return res.status(200).json({
            success: true,
            message: "Coordinates updated successful"
        });


    }catch(error){
        console.log(error);
        errors.general = error.message;
        res.status(500).json({
            success: false,
            message:errors
        })
    }
}