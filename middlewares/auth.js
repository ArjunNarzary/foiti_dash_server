const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.isAuthenticated = async (req, res, next) => {
  const errors = {};
  try {
    const { token } = req.headers;

    if (!token) {
      errors.general = "Please login first";
      return res.status(401).json({
        success: false,
        message: errors,
      });
    }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) {
      errors.general = "Unauthorized user";
      return res.status(400).json({
        success: false,
        message: errors,
      });
    }

    if (user.terminated) {
      errors.general = "Your account has been terminated.";
      return res.status(403).json({
        success: false,
        message: errors,
      });
    }

    req.body.authUser = user;
    next();
  } catch (error) {
    errors.general = "Your are not authorized user";
    return res.status(400).json({
      success: false,
      message: errors,
    });
  }
};
