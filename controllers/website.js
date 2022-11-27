const Post = require("../models/Post");

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
        console.log(post_id);

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
