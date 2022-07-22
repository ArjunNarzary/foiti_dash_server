const jwt = require("jsonwebtoken");
const FoitiTeam = require("../models/FoitiTeam");

exports.isAuthenticatedAdmin = async (req, res, next) => {
  //bearer token
  const errors = {};
  try {
    // const authorization  = req.headers['authorization'];
    const { token } = req.cookies;
    // if (!authorization) {
    //   errors.general = "Please login first";
    //   console.log(errors);
    //   return res.status(401).json({
    //     success: false,
    //     message: errors,
    //   });
    // }
    // const token = authorization.split(' ')[1];

    if (!token) {
      errors.general = "Please login first";
      console.log(errors);
      return res.status(401).json({
        success: false,
        message: errors,
      });
    }

    const decoded = await jwt.verify(token, process.env.REFRESH_JWT_SECRET);
    const team = await FoitiTeam.findById(decoded._id);
    if (!team) {
      errors.general = "Unauthorized user";
      return res.status(400).json({
        success: false,
        message: errors,
      });
    }

    req.body.authAdmin = team;
    next();
  } catch (error) {
    errors.general = "Your are not authorized user";
    return res.status(400).json({
      success: false,
      message: errors,
    });
  }
};
