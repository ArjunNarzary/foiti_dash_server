const jwt = require("jsonwebtoken");
const sharp = require("sharp");
const fs = require("fs");
const util = require("util");
const User = require("../models/User");
const Place = require("../models/Place");
const unlinkFile = util.promisify(fs.unlink);
const { uploadFile, deleteFile } = require("../utils/s3");
const Post = require("../models/Post");

//CREATE POST
exports.createPost = async (req, res) => {
  const errors = {};
  try {
    const { token } = req.headers;
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);

    const details = JSON.parse(req.body.details);

    //Validate CAPTION LENGTH
    if (req.body.caption.length > 1000) {
      errors.caption = "Please write caption within 1000 characeters";
      res.status(400).json({
        success: false,
        message: errors,
      });
    }
    //IF user not found
    if (!user) {
      errors.general = "Unauthorized User";
      res.status(400).json({
        success: false,
        message: errors,
      });
    }

    //IF USER UPLOAD STATUS IS FALSE
    if (user.upload_status === false) {
      errors.general = "You are not authorized to upload post yet";
      res.status(400).json({
        success: false,
        message: errors,
      });
    }

    //UPLOAD IMAGE TO S3
    //Resize post Image if width is larger than 1080
    let resultLarge = {};
    if (details.images[0].width > 1080) {
      const sharpLarge = await sharp(req.file.path).resize(1080).toBuffer();
      resultLarge = await uploadFile(req.file, sharpLarge);
    } else {
      const fileStream = fs.createReadStream(file.path);
      resultLarge = await uploadFile(req.file, fileStream);
    }

    //Resize Image for thumbnail
    const sharpThumb = await sharp(req.file.path).resize(50).toBuffer();
    const resultThumb = await uploadFile(req.file, sharpThumb);

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
      });
      newPlaceCreated = true;
    }

    if (!place) {
      errors.message = "Please try again after some time.";
      res.status(500).json({
        success: false,
        error: errors,
      });
    }

    //CREATE POST AND UPDATE PLACE TABLE
    let status = false;
    if (user.account_status === "active") {
      status = true;
    }
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
    const post = await Post.create({
      name: details.name,
      user: user._id,
      place: place._id,
      content,
      caption: req.body.caption,
      status,
    });

    //delete file from server storage
    await unlinkFile(req.file.path);

    //ADD POST IN PLACE
    place.posts.push(post._id);
    await place.save();

    res.status(201).json({
      success: true,
      post,
      newPlaceCreated,
    });

    //Create post
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
