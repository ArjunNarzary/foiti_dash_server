const jwt = require("jsonwebtoken");
const sharp = require("sharp");
const fs = require("fs");
const util = require("util");
const User = require("../models/User");
const Place = require("../models/Place");
const unlinkFile = util.promisify(fs.unlink);
const { uploadFile, deleteFile } = require("../utils/s3");
const Post = require("../models/Post");
const PostLike = require("../models/PostLike");
const PlaceCreatedBy = require("../models/PlaceCreatedBy");
const ContributionPoint = require("../models/ContributionPoint");
const SavePostPlace = require("../models/SavePostPlace");
const Contribution = require("../models/Contribution");
const { getCountry } = require("../utils/getCountry");

exports.createContributionPoints = async (req, res) => {
  try {
    const contri = await ContributionPoint.create({
      place: 10,
      added_place: 15,
      photo: 5,
      review: 10,
      review_200_characters: 10,
      rating: 1,
      reports: 10,
    });

    res.json({
      success: true,
      contri,
    });
  } catch (error) {}
};

//CREATE POST
exports.createPost = async (req, res) => {
  let errors = {};
  try {
    const { token } = req.headers;
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);

    const details = JSON.parse(req.body.details);

    //Validate CAPTION LENGTH
    if (req.body.caption.length > 2000) {
      errors.caption = "Please write caption within 2000 characeters";
      await unlinkFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: errors,
      });
    }
    //IF user not found
    if (!user) {
      errors.general = "Unauthorized User";
      await unlinkFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: errors,
      });
    }

    //IF USER UPLOAD STATUS IS FALSE
    if (user.upload_status === false) {
      errors.general = "You are not authorized to upload post yet";
      await unlinkFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: errors,
      });
    }

    //UPLOAD IMAGE TO S3
    //Resize post Image if width is larger than 1080
    let resultLarge = {};
    // if (details.images[0].width > 1080) {
    //   const sharpLarge = await sharp(req.file.path)
    //     .resize(1080)
    //     .withMetadata()
    //     .toBuffer();
    //   resultLarge = await uploadFile(req.file, sharpLarge);
    // } else {
    //   const fileStream = fs.createReadStream(req.file.path);
    //   resultLarge = await uploadFile(req.file, fileStream);
    // }
    // console.log(req.file);
    // const fileStream = fs.createReadStream(req.file.path);
    // resultLarge = await uploadFile(req.file, fileStream);

    const sharpLarge = await sharp(req.file.path)
      .resize(1080)
      .withMetadata()
      .toBuffer();
    resultLarge = await uploadFile(req.file, sharpLarge);

    //Resize Image for thumbnail
    const sharpThumb = await sharp(req.file.path)
      .resize(500, 500, { fit: "cover" })
      .withMetadata()
      .toBuffer();
    const resultThumb = await uploadFile(req.file, sharpThumb);
    // const resultThumb = await uploadFile(req.file, fileStream);

    //CHECK IF PLACE ID IS ALREADY PRESENT
    let newPlaceCreated = false;
    let place = await Place.findOne({ google_place_id: details.place_id });
    if (!place) {
      place = await Place.create({
        name: details.name,
        google_place_id: details.place_id,
        address: details.address,
        coordinates: details.coordinates,
        types: details.types,
        created_place: details.created_place,
      });
      newPlaceCreated = true;
    }

    if (!place) {
      errors.message = "Please try again after some time.";
      await unlinkFile(req.file.path);
      //IF UPLOADED DELETE FROM S3
      if (resultThumb.Key || resultLarge.Key) {
        await deleteFile(resultThumb.Key);
        await deleteFile(resultLarge.Key);
      }
      return res.status(500).json({
        success: false,
        error: errors,
      });
    }

    //CHECK IF USER ALREADY UPLOADED POST FOR CURRENT PLACE
    let uploadedBefore = false;
    const uploaded = await Post.find({})
      .where("user")
      .equals(user._id)
      .where("place")
      .equals(place._id);
    if (uploaded.length > 0) {
      uploadedBefore = true;
    }

    //CREATE POST AND UPDATE PLACE TABLE
    // let status = false;
    // if (user.account_status === "active") {
    //   status = true;
    // }
    const content = [
      {
        image: {
          thumbnail: {
            public_url: resultThumb.Location,
            private_id: resultThumb.Key,
          },
          large: {
            public_url: resultLarge.Location,
            private_id: resultLarge.Key,
          },
        },
        coordinate: {
          lat: details.images[0].coordinates.lat,
          lng: details.images[0].coordinates.lng,
        },
        type: details.images[0].type,
      },
    ];
    //Create post
    const post = await Post.create({
      name: details.name,
      user: user._id,
      place: place._id,
      content,
      caption: req.body.caption,
      status: user.account_status,
    });

    //ADD POST IN PLACE
    place.posts.push(post._id);
    await place.save();

    //ADD PLACE IN PLACECREATEDBY TABLE AND CONTRIBUTION TABLE
    //FIND CONTRIBUTION OR CREATE NEW
    let contribution = await Contribution.findOne({ userId: user._id });
    if (!contribution) {
      contribution = await Contribution({ userId: user._id });
    }

    //IF IMAGE HAS COORDINATES
    if (
      post.content[0].coordinate.lat !== "" &&
      post.content[0].coordinate.lng !== ""
    ) {
      //Add to placeCreatedTableBy
      if (newPlaceCreated) {
        await PlaceCreatedBy.create({
          place: place._id,
          user: user._id,
        });

        //ADD to contribution table
        contribution.places.push(place._id);
      }

      //TODO::ADD COUNTRY VISITED
      if (!uploadedBefore) {
        user.visited.places = user.visited.places + 1;
      }
      //ADD POST TO CONTRIBUTION TABLE
      contribution.photos.push(post._id);

      user.total_uploads = user.total_uploads + 1;
      post.coordinate_status = true;
      await user.save();
    } else {
      post.coordinate_status = false;
    }

    if (place.created_place) {
      contribution.added_places.push(place._id);
    }
    await post.save();
    await contribution.save();

    //delete file from server storage
    await unlinkFile(req.file.path);

    return res.status(201).json({
      success: true,
      post,
      uploadedBefore,
    });
  } catch (error) {
    console.log(error);
    errors.general = error.message;
    if (req.file) {
      await unlinkFile(req.file.path);
    }
    //IF UPLOADED DELETE FROM S3
    if (resultThumb.Key || resultLarge.Key) {
      await deleteFile(resultThumb.Key);
      await deleteFile(resultLarge.Key);
    }
    return res.status(500).json({
      success: false,
      error: errors,
    });
  }
};

//EDID POST
exports.editPost = async (req, res) => {
  let errors = {};
  try {
    const { authUser, details, caption } = req.body;
    const postId = req.params.id;

    //Validate CAPTION LENGTH
    if (caption.length > 1000) {
      errors.caption = "Please write caption within 1000 characeters";
      res.status(400).json({
        success: false,
        message: errors,
      });
    }
    if (details.name == "" && caption.length === 0) {
      errors.general =
        "You must change either location or caption to edit the post";
      res.status(400).json({
        success: false,
        message: errors,
      });
    }

    //GET POST DETAILS
    const post = await Post.findById(postId);

    //CHECK IF POST EXIST
    if (!post) {
      errors.general = "Post not found";
      res.status(404).json({
        success: false,
        message: errors,
      });
    }

    //CHECK WEATHER AUTHORIZED USER
    if (post.user.toString() !== authUser._id.toString()) {
      errors.general = "Your are not authorize to edit this post";
      res.status(401).json({
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
      errors.message = "Please try again after some time.";
      res.status(500).json({
        success: false,
        error: errors,
      });
    }

    const contribution = await Contribution.findOne();

    //IF NEW PLACE IS NOT SAME REMOVE POST FROM PREVIOUS PLACE
    if (details.name != "") {
      if (place.google_place_id.toString() !== details.place_id.toString()) {
        if (place.posts.includes(post._id)) {
          const index = place.posts.indexOf(post._id);
          place.posts.splice(index, 1);
          await place.save();
        }

        //DELET PLACE IF NO POST AVAILABLE
        if (place.posts.length === 0) {
          const placeCreated = await PlaceCreatedBy.findOne({
            place: place._id,
          });

          //REMOVE CONTRIBUITION FROM THE USER WHO CREATED THE PLACE
          const user = await User.findById(placeCreated._id);
          if (user) {
            user.total_contribution =
              user.total_contribution - contribution.place;
            user.visited.places -= 1;
            await user.save();
          }
          await placeCreated.deleteOne();
          await place.deleteOne();
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
            types: details.types,
          });
          newPlaceCreated = true;
        }
      }
    }

    //TODO::IF NEW PLACE ADDED
    if (newPlaceCreated) {
      await PlaceCreatedBy.create({
        place: place._id,
        user: authUser._id,
      });

      const currentUser = await User.findById(authUser._id);
      currentUser.total_contribution =
        currentUser.total_contribution + contribution.place;
      await currentUser.save();
    }

    //UPDATE POST AND UPDATE PLACE TABLE

    //Create post
    if (!samePlace) {
      post.name = details.name;
      post.place = place._id;
    }
    if (caption.length > 0) {
      post.caption = req.body.caption;
    }
    await post.save();

    //ADD POST IN PLACE
    if (!samePlace) {
      place.posts.push(post._id);
      await place.save();
    }

    res.status(200).json({
      success: true,
      post,
      newPlaceCreated,
    });
  } catch (error) {
    errors.general = error.message;
    res.status(500).json({
      success: false,
      error: errors,
    });
  }
};

//View Post
exports.viewPost = async (req, res) => {
  let errors = {};
  try {
    const postId = req.params.id;
    const { authUser } = req.body;

    const post = await Post.findById(postId).populate("user").populate("place");

    if (!post || post.status === "deactivated") {
      errors.general = "Post not found";
      return res.status(404).json({
        success: false,
        message: errors,
      });
    }

    let liked = false;
    if (await post.hasLiked(authUser._id)) {
      liked = true;
    }

    return res.status(200).json({
      success: true,
      post,
      liked,
    });
  } catch (error) {
    errors.general = error.message;
    return res.status(500).json({
      success: false,
      error: errors,
    });
  }
};

//DELETE POST

//LIKE UNLIKE POST
exports.likeUnlikePost = async (req, res) => {
  let errors = {};
  try {
    const postId = req.params.id;
    const { authUser } = req.body;
    const post = await Post.findById(postId);

    //IF NOT POST FOUND
    if (!post) {
      errors.general = "Post not found";
      res.status(404).json({
        success: false,
        message: errors,
      });
    }

    //UNLIKE IF ALEADY LIKED
    if (post.like.includes(authUser._id)) {
      const index = post.like.indexOf(authUser.id);
      post.like.splice(index, 1);
      await post.save();

      //Remove from PostLike table
      await PostLike.deleteOne({
        $and: [{ user: authUser._id }, { post: post._id }],
      });

      return res.status(200).json({
        success: true,
        message: "You have successfully unliked the post",
      });
    } else {
      post.like.push(authUser._id);
      await post.save();

      //Add to POSTLIKE TABLE
      await PostLike.create({
        user: authUser._id,
        post: post._id,
      });

      return res.status(200).json({
        success: true,
        message: "You have successfully liked the post",
      });
    }
  } catch (error) {
    errors.general = error.message;
    res.status(500).json({
      success: false,
      error: errors,
    });
  }
};

//Save and Unsave post
exports.savePost = async (req, res) => {
  let errors = {};
  try {
    const postId = req.params.id;
    const { authUser } = req.body;

    const post = await Post.findById(postId);
    //IF NOT POST FOUND
    if (!post) {
      errors.general = "Post not found";
      res.status(404).json({
        success: false,
        message: errors,
      });
    }

    //If post is already save by user
    if (post.saved.includes(authUser._id)) {
      const index = post.saved.indexOf(authUser._id);
      post.saved.splice(index, 1);
      await post.save();

      //Remove from SavePostPlace table
      await SavePostPlace.deleteOne({
        and: [{ user: authUser._id }, { post: post._id }],
      });

      res.status(200).json({
        success: true,
        message: "You have successfully unsave the post",
      });
      return;
    }

    post.saved.push(authUser._id);
    await post.save();

    //Add in SavePostPlace table
    await SavePostPlace.create({
      user: authUser._id,
      post: post._id,
    });

    res.status(200).json({
      success: true,
      message: "You have successfully save the post",
    });
  } catch (error) {
    errors.general = error.message;
    res.status(500).json({
      success: false,
      error: errors,
    });
  }
};

//GET RANDOM POSTS
exports.randomPosts = async (req, res) => {
  let errors = {};
  try {
    const { ip, authUser } = req.body;
    const posts = await Post.find({
      status: "active",
      coordinate_status: true,
    })
      .where("user")
      .ne(authUser._id)
      .populate("place");

    if (!posts) {
      errors.general = "No posts found";
      res.status(404).json({
        success: false,
        message: errors,
      });
    }

    const randomPosts = [];
    for (let i = 0; i < 20; i++) {
      const randomIndex = Math.floor(Math.random() * posts.length);
      const post = posts[randomIndex];
      randomPosts.push(post);
    }

    let country = "";
    const location = getCountry(ip);
    if (location) {
      country = location.country;
    } else {
      country = "IN";
    }

    randomPosts.forEach((post) => {
      // console.log("post1", post.display_address_for_own_country);
      if (post.place.address.short_country == country) {
        post.place.address.country = "";
        post.place.local_address = post.display_address_for_own_country;
      } else {
        let state = "";
        if (post.place.address.administrative_area_level_1 != null) {
          state = post.place.address.administrative_area_level_1;
        } else if (post.place.address.administrative_area_level_2 != null) {
          state = post.place.address.administrative_area_level_2;
        } else if (post.place.address.locality != null) {
          state = post.place.address.locality;
        } else if (post.place.address.sublocality_level_1 != null) {
          state = post.place.address.sublocality_level_1;
        } else if (post.place.address.sublocality_level_2 != null) {
          state = post.place.address.sublocality_level_2;
        } else if (post.place.address.neighborhood != null) {
          state = post.place.address.neighborhood;
        }

        post.place.short_address = state + ", " + post.place.address.country;
      }
    });

    res.status(200).json({
      success: true,
      randomPosts,
    });
  } catch (error) {
    errors.general = error.message;
    res.status(500).json({
      success: false,
      error: errors,
    });
  }
};
