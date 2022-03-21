const sharp = require("sharp");
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
const { validationResult } = require("express-validator");
const User = require("../models/User");
const FollowDetail = require("../models/FollowDetail");
const { uploadFile, deleteFile } = require("../utils/s3");
const Sharp = require("sharp");
const jwt = require("jsonwebtoken");

function createError(errors, validate) {
  const arrError = validate.array();
  errors[arrError[0].param] = arrError[0].msg;
  return errors;
}

//CREATE USER
exports.registerUser = async (req, res) => {
  const errors = {};

  try {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const validate = validationResult(req);
    if (!validate.isEmpty()) {
      return res.status(400).json({
        success: false,
        // message: validate.array(),
        message: createError(errors, validate),
      });
    }

    const newUserData = {
      email: req.body.email,
      password: req.body.password,

      //CHANGES BELOW IN FUTURE
      upload_status: true,
      account_status: "silent",
    };

    const user = await User.create(newUserData);

    const token = await user.generateToken();

    return res.status(201).json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    (errors.general = error.message),
      res.status(500).json({
        success: false,
        message: errors,
      });
  }
};

//LOGIN USER
exports.loginUser = async (req, res) => {
  let errors = {};
  try {
    const validate = validationResult(req);
    if (!validate.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: createError(errors, validate),
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select(
      "password name email username account_status terminated"
    );
    if (!user) {
      errors.email = "User does not exist";
      return res.status(400).json({
        success: false,
        message: errors,
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      errors.password = "You have entered wrong password";
      return res.status(401).json({
        success: false,
        message: errors,
      });
    }

    if (user.terminated) {
      errors.genearl = "Your account has been terminated.";
      return res.status(401).json({
        success: false,
        message: errors,
      });
    }

    const token = await user.generateToken();

    return res.status(200).json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    errors.general = error.message;
    res.status(500).json({
      success: false,
      message: errors,
    });
  }
};

//EDIT PROFILE
exports.editProfile = async (req, res) => {
  let errors = {};
  try {
    const validate = validationResult(req);
    if (!validate.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: createError(errors, validate),
      });
    }

    const { name, username, bio, website, address, authUser } = req.body;

    const userWithSameUsername = await User.find({
      $and: [{ username: username }, { _id: { $ne: authUser._id } }],
    });

    if (userWithSameUsername.length > 0) {
      errors.username = "Username has alrady been taken";
      return res.status(409).json({
        success: false,
        message: errors,
      });
    }

    const user = await User.findById(authUser._id);

    user.name = name;
    user.username = username;
    user.bio = bio;
    user.website = website;
    user.address = address;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile edited successful",
    });
  } catch (error) {
    errors.general = error.message;
    res.status(500).json({
      success: false,
      message: errors,
    });
  }
};

//View own profile
exports.viewOwnProfile = async (req, res) => {
  const errors = {};
  try {
    const { authUser } = req.body;
    const user = authUser;

    return res.status(200).json({
      success: true,
      user,
      totalFollowing: authUser.totalFollowing,
      totalFollower: authUser.totalFollower,
    });
  } catch (error) {
    errors.general = error.message;
    res.status(500).json({
      success: false,
      message: errors,
    });
  }
};

//View others profile
exports.viewOthersProfile = async (req, res) => {
  const errors = {};
  try {
    const profileId = req.params.id;
    const { authUser } = req.body;

    const profileUser = await User.findById(profileId);
    if (!profileUser) {
      errors.general = "User not found";
      res.status(404).json({
        success: false,
        message: errors,
      });
    }

    //CHECK WHEATHER FOLLOWED CURRENT USER
    let isFollowed = false;
    if (profileUser.isFollowed(authUser._id)) {
      isFollowed = true;
    }

    return res.status(200).json({
      success: true,
      user: profileUser,
      isFollowed,
    });
  } catch (error) {
    errors.general = error.message;
    res.status(500).json({
      success: false,
      message: errors,
    });
  }
};

//FOLLOW UNFOLLOW USER
exports.followUnfollowUser = async (req, res) => {
  const errors = {};
  try {
    const { authUser } = req.body;
    const ownerId = req.params.id;

    const owner = await User.findById(ownerId);
    const user = await User.findById(authUser._id);
    if (!owner) {
      errors.general = "User not found";
      return res.status(404).json({
        success: false,
        message: errors,
      });
    }

    //Already followed than unfollow
    if (owner.follower.includes(authUser._id)) {
      const index = owner.follower.indexOf(authUser.id);
      owner.follower.splice(index, 1);
      await owner.save();

      //Remove owner from auth users following
      const ownIndex = user.following.indexOf(owner._id);
      user.following.splice(ownIndex, 1);
      await user.save();
      //Remove from FollowDetail table
      await FollowDetail.deleteOne({
        $and: [{ follower: user._id }, { following: owner._id }],
      });

      return res.status(200).json({
        success: true,
        message: `You have unfollowed ${owner.name}`,
      });
    } else {
      owner.follower.push(user._id);
      user.following.push(owner._id);
      await owner.save();
      await user.save();

      //Create details in Follow Details model
      await FollowDetail.create({
        follower: user._id,
        following: owner._id,
      });

      return res.status(200).json({
        success: true,
        message: `You are now following ${owner.name}`,
      });
    }
  } catch (error) {
    errors.general = error.message;
    res.status(500).json({
      success: false,
      message: errors,
    });
  }
};

//UPLOAD OR CHANGE PROFILE IMAGE
// const storage = multer.memoryStorage();

exports.uploadProfileImage = async (req, res) => {
  const errors = {};
  try {
    const { token } = req.headers;
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) {
      errors.general = "Unauthorized User";
      res.status(400).json({
        success: false,
        message: errors,
      });
    }

    //Resize Image for large DP
    const sharpLarge = await sharp(req.file.path).resize(100).toBuffer();
    const resultLarge = await uploadFile(req.file, sharpLarge);
    //Resize Image for thumbnail
    const sharpThumb = await sharp(req.file.path).resize(50).toBuffer();
    const resultThumb = await uploadFile(req.file, sharpThumb);

    //If not empty delete file from S3
    if (user.profileImage.large.private_id != null) {
      await deleteFile(user.profileImage.large.private_id);
      await deleteFile(user.profileImage.thumbnail.private_id);
    }
    const newData = {
      large: {
        public_url: resultLarge.Location,
        private_id: resultLarge.Key,
      },
      thumbnail: {
        public_url: resultThumb.Location,
        private_id: resultThumb.Key,
      },
    };
    user.profileImage = newData;
    await user.save();

    //delete file from server storage
    await unlinkFile(req.file.path);
    res.status(200).json({
      success: true,
      message: "Profile uploaded successful",
      // user,
    });
  } catch (error) {
    errors.general = error.message;
    res.status(500).json({
      success: false,
      message: errors,
    });
  }
};

exports.uploadCoverImage = async (req, res) => {
  const errors = {};
  try {
    const { token } = req.headers;
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) {
      errors.general = "Unauthorized User";
      res.status(400).json({
        success: false,
        message: errors,
      });
    }

    //Resize Image for large DP
    const sharpLarge = await sharp(req.file.path).resize(1080).toBuffer();
    const resultLarge = await uploadFile(req.file, sharpLarge);

    //If not empty delete file from S3
    if (user.coverImage.large.private_id != null) {
      console.log("Delete File");
      await deleteFile(user.coverImage.large.private_id);
    }
    const newData = {
      large: {
        public_url: resultLarge.Location,
        private_id: resultLarge.Key,
      },
    };
    user.coverImage = newData;
    await user.save();

    //delete file from server storage
    await unlinkFile(req.file.path);
    res.status(200).json({
      success: true,
      message: "Cover uploaded successful",
      // user,
    });
  } catch (error) {
    errors.general = error.message;
    res.status(500).json({
      success: false,
      message: errors,
    });
  }
};
