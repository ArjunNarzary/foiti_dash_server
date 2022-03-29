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
const Post = require("../models/Post");
const Otp = require("../models/Otp");
const crypto = require("crypto");
const { sendEmail } = require("../middlewares/sentEmail");

function createError(errors, validate) {
  const arrError = validate.array();
  errors[arrError[0].param] = arrError[0].msg;
  return errors;
}

function randomString(length, chars) {
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function generateUniqueUsername(rString) {
  return User.findOne({ username: rString })
    .then(function (account) {
      if (account) {
        rString = randomString(10, "0123456789abcdefghijklmnopqrstuvwxyz.");
        return generateUniqueUsername(rString); // <== return statement here
      }
      return rString;
    })
    .catch(function (err) {
      console.error(err);
      throw err;
    });
}

//CREATE USER
exports.registerUser = async (req, res) => {
  let errors = {};

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

    //CREATE RANDOM USERNAME
    let rString = randomString(10, "0123456789abcdefghijklmnopqrstuvwxyz");
    console.log(rString);
    const username = await generateUniqueUsername(rString);

    const newUserData = {
      email: req.body.email.trim(),
      password: req.body.password,
      username,

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
    errors.general = error.message;
    console.log(error);
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

    let { email, password } = req.body;
    email = email.toLowerCase().trim();

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
      errors.general = "Your account has been terminated.";
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

//Enter name
exports.enterName = async (req, res) => {
  let errors = {};
  try {
    const validate = validationResult(req);
    if (!validate.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: createError(errors, validate),
      });
    }

    const { name, authUser } = req.body;

    const user = await User.findById(authUser._id);

    user.name = name;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "You have successfully added your name",
      user,
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

    const { name, bio, website, address, authUser } = req.body;

    // const userWithSameUsername = await User.find({
    //   $and: [{ username: username }, { _id: { $ne: authUser._id } }],
    // });

    // if (userWithSameUsername.length > 0) {
    //   errors.username = "Username has alrady been taken";
    //   return res.status(409).json({
    //     success: false,
    //     message: errors,
    //   });
    // }

    const user = await User.findById(authUser._id);

    user.name = name;
    // user.username = username;
    user.bio = bio;
    user.website = website;
    user.address = address;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile edited successful",
      user,
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
  let errors = {};
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
  let errors = {};
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

    if (profileUser.account_status === "deactivated") {
      res.status(401).json({
        success: false,
        message: "This account has been deactivated",
      });
    }

    if (profileUser.terminated) {
      res.status(401).json({
        success: false,
        message: "This account has been terminated",
      });
    }

    //CHECK WHEATHER FOLLOWED CURRENT USER
    let isFollowed = false;
    if (await profileUser.isFollowed(authUser._id)) {
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

//View all post of particular user
exports.viewAllPost = async (req, res) => {
  let errors = {};
  try {
    const profileId = req.params.id;
    const { authUser, skip, limit } = req.body;

    if (skip == null || limit == null) {
      errors.general = "Please provide skips and limits";
      return res.json({
        success: false,
        message: errors,
      });
    }

    let posts;
    if (profileId.toString() === authUser._id.toString()) {
      //IF OWN PROFILE
      posts = await Post.find({})
        .where("user")
        .equals(profileId)
        .sort({ updatedAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit));
    } else {
      //IF OTHERS PROFILE
      posts = await Post.find({})
        .where("user")
        .equals(profileId)
        .where("coordinate_status")
        .equals(true)
        .sort({ updatedAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit));
    }

    if (posts.length === 0) {
      (errors.general = "No post avialble"),
        res.status(404).json({
          success: false,
          message: errors,
          posts,
        });
    }

    const totalCount = posts.length;
    const newSkip = skip + totalCount;

    return res.status(200).json({
      posts,
      newSkip,
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
  let errors = {};
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
  let errors = {};
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
    const sharpLarge = await sharp(req.file.path).resize(150).toBuffer();
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

//UPLOAD OR CHANGE COVER PICTURE
exports.uploadCoverImage = async (req, res) => {
  let errors = {};
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
    const sharpLarge = await sharp(req.file.path).resize(640).toBuffer();
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

//UPDATE PASSWORD
exports.updatePassword = async (req, res) => {
  let errors = {};
  try {
    const validate = validationResult(req);
    if (!validate.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: createError(errors, validate),
      });
    }

    const { authUser, currentPassword, newPassword } = req.body;
    const user = await User.findById(authUser._id).select("+password");

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      errors.currentPassword = "Current password does not match";
      return res.status(401).json({
        success: false,
        message: errors,
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been updated successfully",
    });
  } catch (error) {
    errors.general = error.message;
    res.status(500).json({
      success: false,
      message: errors,
    });
  }
};

//RESET PASSWORD (SENT OTP AT EMAIL)
exports.resetPassword = async (req, res) => {
  let errors = {};
  try {
    const validate = validationResult(req);
    if (!validate.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: createError(errors, validate),
      });
    }

    const email = req.body.email;
    const user = await User.findOne({ email });

    let otp = await Otp.findOne({ userId: user._id });
    if (otp) {
      await otp.deleteOne();
    }

    const newOtp = user.generateOtp();
    const message = `One time password for resetting your passward is ${newOtp}. This OTP is valid for 15 minutes.`;

    otp = await Otp.create({
      userId: user._id,
      otp: newOtp,
    });

    //SEND EMAIL
    try {
      await sendEmail({
        email: user.email,
        subject: "Reset Password",
        message,
      });

      res.status(201).json({
        success: true,
        message: "An otp has been sent to your registered email address",
        id: otp._id,
      });
    } catch (error) {
      errors.general = error.message;
      await otp.deleteOne();
      res.status(500).json({
        success: false,
        message: errors,
      });
    }
  } catch (error) {
    errors.general = error.message;
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: errors,
    });
  }
};

//CHECK OTP
exports.checkOtp = async (req, res) => {
  let errors = {};
  try {
    const validate = validationResult(req);
    if (!validate.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: createError(errors, validate),
      });
    }

    const otpId = req.params.id;
    const otpTable = await Otp.findById(otpId);

    if (!otpTable) {
      errors.general = "Unathourized access";
      return res.status(401).json({
        success: false,
        message: errors,
      });
    }

    const isMatch = await otpTable.matchOtp(req.body.otp);
    if (!isMatch) {
      errors.otp = "Please provide valid OTP";
      return res.status(400).json({
        success: false,
        message: errors,
      });
    }

    const user = await User.findById(otpTable.userId);
    if (!user) {
      errors.otp = "Please try again";
      res.status(400).json({
        success: false,
        message: errors,
      });
    }

    const resetPasswordToken = user.getResetPasswordToken();
    user.save();

    await otpTable.deleteOne();

    res.status(200).json({
      success: true,
      token: resetPasswordToken,
    });
  } catch (error) {
    errors.general = error.message;
    res.status(500).json({
      success: false,
      message: errors,
    });
  }
};

exports.crateNewPassword = async (req, res) => {
  let errors = {};
  try {
    const validate = validationResult(req);
    if (!validate.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: createError(errors, validate),
      });
    }

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.id)
      .digest("hex");
    console.log(resetPasswordToken);

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      errors.general = "Token is invalid or has expired";
      return res.status(400).json({
        success: false,
        message: errors,
      });
    }

    user.password = req.body.password;
    user.email_varified = true;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Your password has been successfully updated",
      user,
    });
  } catch (error) {
    errors.general = error.message;
    res.status(500).json({
      success: false,
      message: errors,
    });
  }
};
