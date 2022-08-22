const Post = require("../models/Post");
const User = require("../models/User");
const Place = require("../models/Place");
const Contribution = require("../models/Contribution");
const PlaceAddedBy = require("../models/PlaceAddedBy");
var ObjectId = require("mongoose").Types.ObjectId;

exports.usersPostCount = async (req, res) => {
  let errors = {};
  try {
    // const posts = await Post.aggregate({$and:[{disabled: false}, {terminated:false}]}).group({user: "$user"});
    const posts = await Post.aggregate([
      {
        $match: {
          $and: [{ deactivated: false }, { terminated: false }],
        },
      },
      {
        $group: {
          _id: "$user",
          post_count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $project: {
          _id: 1,
          name: "$owner.name",
          total_posts: "$post_count",
          account_status: "$owner.account_status",
        },
      },
    ]);
    const activePosts = await Post.aggregate([
      {
        $match: {
          $and: [{ deactivated: false }, { terminated: false }],
        },
      },
      {
        $group: {
          _id: { user: "$user", post_status: "$status" },
          post_count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: "$_id.user",
          total_posts: "$post_count",
          post_status: "$_id.post_status",
        },
      },
    ]);

    posts.map((p) => {
      let total_active = 0;
      activePosts.map((ap) => {
        if (
          p._id.toString() === ap._id.toString() &&
          ap.post_status === "active"
        ) {
          total_active += ap.total_posts;
        }
      });
      p.total_active = total_active;
    });

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    errors.general = "Something went wrong please try again";
    console.log(error);
    res.status(500).json({
      success: false,
      message: errors,
    });
  }
};

exports.usersPost = async (req, res) => {
  let errors = {};
  try {
    const { user_id } = req.params;
    //Validate Object ID
    if (!ObjectId.isValid(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post",
      });
    }

    const posts = await Post.find({ user: user_id })
      .populate("place", "name address google_types")
      .populate("user", "name");
    return res.status(200).json({
      success: true,
      posts,
    });
    // console.log(user_id);
  } catch (error) {
    console.log(error);
    errors.general = error.message;
    res.status(500).json({
      success: false,
      message: errors,
    });
  }
};

exports.updatePostStatus = async (req, res) => {
  let errors = {};
  try {
    const { post_id } = req.params;
    const { action } = req.body;

    //Validate Object ID
    if (!ObjectId.isValid(post_id)) {
      errors.general = "Invalid post";
      return res.status(400).json({
        success: false,
        message: errors,
      });
    }

    if (action == "" || action == undefined) {
      errors.action = "Please select action type";
      return res.status(401).json({
        success: false,
        message: errors,
      });
    }

    const post = await Post.findById(post_id);
    if (!post) {
      errors.general = "Post not found";
      return res.status(404).json({
        success: false,
        message: errors,
      });
    }

    post.status = action;
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Post updated successful",
      post,
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

//Update Coordinates
exports.updateCoors = async (req, res) => {
  let errors = {};
  try {
    const { post_id } = req.params;
    const { lat, lng } = req.body;

    //Validate Object ID
    if (!ObjectId.isValid(post_id)) {
      errors.general = "Invalid post";
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

    const post = await Post.findById(post_id);
    if (!post) {
      errors.general = "Post not found";
      return res.status(404).json({
        success: false,
        message: errors,
      });
    }

    const cordStatus = post.coordinate_status;

    post.content[0].coordinate.lat = lat;
    post.content[0].coordinate.lng = lng;
    post.coordinate_status = true;
    await post.save();

    if (!cordStatus) {
      const user = await User.findById(post.user);
      let contribution = await Contribution.findOne({ userId: post.user });
      if (!contribution) {
        contribution = await Contribution.create({
          userId: post.user,
        });
      }

      if (!contribution.photos_with_coordinates.includes(post_id)) {
        contribution.photos_with_coordinates.push(post._id);
        user.total_contribution = user.total_contribution + 1;
      }

      await user.save();
      await contribution.save();
    }

    return res.status(200).json({
      success: true,
      message: "Coordinates updated successful",
      post,
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

exports.viewPostDetails = async (req, res) => {
  let errors = {};
  try {
    const { post_id } = req.params;

    //Validate Object ID
    if (!ObjectId.isValid(post_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post",
      });
    }

    const post = await Post.findById(post_id)
      .populate("place", "name address google_types types")
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
  } catch (error) {
    console.log(error);
    errors.general = error.message;
    res.status(500).json({
      success: false,
      message: errors,
    });
  }
};

//Update post location
exports.updatePostLocation = async (req, res) => {
  let errors = {};
  try {
    const { post_id } = req.params;
    const { details } = req.body;

    // console.log(post_id);
    // console.log(details);
    // return;

    //Validate Object ID
    if (!ObjectId.isValid(post_id)) {
      errors.general = "Invalid post";
      return res.status(400).json({
        success: false,
        message: errors,
      });
    }

    if (details.place_id == "" || details.place_id == undefined) {
      errors.general = "Please select location again";
      return res.status(401).json({
        success: false,
        message: errors,
      });
    }

    const post = await Post.findById(post_id);
    if (!post) {
      errors.general = "Post not found";
      return res.status(404).json({
        success: false,
        message: errors,
      });
    }

    //CHECK IF PLACE ID IS ALREADY PRESENT
    let newPlaceCreated = false;
    let samePlace = true;

    //GET CURRENT PLACE AND REMOVE POST FROM THERE
    let place = await Place.findById(post.place);

    if (!place) {
      errors.general = "Please try again after some time.";
      res.status(500).json({
        success: false,
        error: errors,
      });
    }

    //IF NEW PLACE IS NOT SAME REMOVE POST FROM PREVIOUS PLACE
    if (place.google_place_id.toString() !== details.place_id.toString()) {
      if (place.posts.includes(post._id)) {
        const index = place.posts.indexOf(post._id);
        place.posts.splice(index, 1);
        await place.save();
      }

      //DELETE PLACE IF NO POST AVAILABLE
      if (place.posts.length === 0) {
        const placeCreated = await PlaceAddedBy.findOne({
          place: place._id,
        });

        //REMOVE CONTRIBUITION FROM THE USER WHO CREATED THE PLACE
        if (placeCreated) {
          const placeCreator = await User.findById(placeCreated.user);
          //REMOVE PLACE FROM CONTRIBUTION TABLE
          const contribution = await Contribution.findOne({
            userId: placeCreator._id,
          });
          if (contribution.added_places.includes(place._id)) {
            const index = contribution.added_places.indexOf(place._id);
            contribution.added_places.splice(index, 1);
            await contribution.save();
          }
          if (placeCreator) {
            placeCreator.total_contribution =
              contribution.calculateTotalContribution();
            await placeCreator.save();
          }

          await placeCreated.deleteOne();
        }
        if (place.reviewed_status === false) {
          await place.deleteOne();
        }else{
          place.cover_photo = {};
          await place.save();
        }
      }else{
        //REPLACE PLACE COVER PHOTO IF DELETED POST IS COVER PHOTO`
        if (
          place.cover_photo.large.private_id ==
          post.content[0].image.large.private_id
        ) {
          //GET MOST LIKE ARRAY COUNT
          const HighestLikedPost = await Post.aggregate([
            {
              $match: Post.where("_id")
                .ne(post._id)
                .where("place")
                .equals(place._id)
                .where("coordinate_status")
                .equals(true)
                .cast(Post),
            },
            {
              $addFields: {
                TotalLike: { $size: "$like" },
              },
            },
            { $sort: { TotalLike: -1 } },
          ]).limit(1);
          if (HighestLikedPost.length > 0) {
            place.cover_photo = HighestLikedPost[0].content[0].image;
          } else {
            place.cover_photo = {};
          }
        }
        await place.save();
      }
      samePlace = false;
    }

    if (!samePlace) {
      place = await Place.findOne({ google_place_id: details.place_id });
      if (!place) {
        place = await Place.create({
          name: details.name,
          google_place_id: details.place_id,
          address: details.address,
          coordinates: details.coordinates,
          google_types: details.types,
          cover_photo: post.content[0].image,
        });
        newPlaceCreated = true;
      }
    }

    //Create post
    if (!samePlace) {
      post.name = details.name;
      post.place = place._id;
      place.posts.push(post._id);
    }

    //IF IMAGE HAS COORDINATES
    const currentUser = await User.findById(post.user);
    const currentUserContribution = await Contribution.findOne({
      userId: post.user,
    });

    //Add to placeCreatedTableBy
    if (newPlaceCreated) {
      await PlaceAddedBy.create({
        place: place._id,
        user: post.user,
      });
      //ADD to contribution table
      currentUserContribution.added_places.push(place._id)
    }
    await currentUserContribution.save();
    currentUser.total_contribution =
      currentUserContribution.calculateTotalContribution();
    await currentUser.save();

    await post.save();
    await place.save();

    const newPost = await Post.findById(post._id)
      .populate("place", "name address google_types types")
      .populate("user", "name");

    return res.status(200).json({
      success: true,
      message: "Post updated successful",
      newPost,
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
