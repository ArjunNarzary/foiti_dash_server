const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const FoitiTeam = require("../models/FoitiTeam");

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
    return FoitiTeam.findOne({ username: rString })
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

//TTEST URL
exports.test = async (req, res)=>{
    return res.status(200).json({
        messgae: "ok",
    })
}


//CREATE USER
exports.registerTeam = async (req, res) => {
    let errors = {};

    try {
        // Finds the validation errors in this request and wraps them in an object with handy functions
        // const validate = validationResult(req);
        // if (!validate.isEmpty()) {
        //     return res.status(400).json({
        //         success: false,
        //         // message: validate.array(),
        //         message: createError(errors, validate),
        //     });
        // }

        //CREATE RANDOM USERNAME
        let rString = randomString(10, "0123456789abcdefghijklmnopqrstuvwxyz");
        const username = await generateUniqueUsername(rString);

        const newTeamData = {
            name: "Admin",
            email: "admin@foiti.com",
            password: "password",
            username,
        };

        const team = await FoitiTeam.create(newTeamData);

        // const token = await team.generateToken();
        team.password = "";

        return res.status(201).json({
            success: true,
            team,
        });
    } catch (error) {
        console.log(error.message);
        errors.general = "Something went wrong";
        // errors.general = error.message;
        res.status(500).json({
            success: false,
            message: errors,
        });
    }
};

//LOGIN USER
exports.loginTeam = async (req, res) => {
    let errors = {};
    try {
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: createError(errors, validate),
            });
        }

        let { username, password } = req.body;
        username = username.toLowerCase().trim();

        const team = await FoitiTeam.findOne({
            $or: [{ username: username }, { email: username }],
        }).select("+password");
        if (!team) {
            errors.password =
                "Your password is incorrect or this account doesn't exist";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        const isMatch = await team.matchPassword(password);

        if (!isMatch) {
            errors.password =
                "Your password is incorrect or this account doesn't exist";
            return res.status(401).json({
                success: false,
                message: errors,
            });
        }

        const token = await team.generateAccessToken();
        const refreshToken = await team.generateRefeshToken();
        const options = {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            // secure: process.env.NODE_ENV !== 'development',
            secure: true,
            sameSite: 'none',
        }

        team.password = "";

        return res.status(200).cookie("token", refreshToken, options).json({
            success: true,
            user:team,
            token,
        });
    } catch (error) {
        console.log(error);
        errors.general = "Something went wrong while logging in";
        return res.status(500).json({
            success: false,
            message: errors,
        });
    }
};

//LOGOUT USER
exports.logoutTeam = async (req, res) => {
    try {
        const options = {
            expires: new Date(Date.now()),
            httpOnly: true,
            // secure: process.env.NODE_ENV !== 'development',
            secure: true,
            sameSite: 'none',
        }
        res.status(200).cookie("token", null, options).json({
            success: true,
            message: "You have been logged out",
        });
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

//REFRESH TOKEN
exports.refreshToken = async (req, res) => {
    let errors = {};
    try{
        const token = req.cookies.token;
        if(!token){
            return res.status(401).json({
                success: false,
                accessToken: ''
            })
        }

        const decoded = jwt.verify(token, process.env.REFRESH_JWT_SECRET);

        //token is valid and we can send back access token
        const team = await FoitiTeam.findById(decoded._id);
        if (!team) {
            errors.general = "Unauthorized user";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        if(team.tokenVersion !== decoded.tokenVersion){
            errors.general = "Unauthorized user";
            return res.status(400).json({
                success: false,
                accessToken: '',
            });
        }

        const accessToken = await team.generateAccessToken();
        const refreshToken = await team.generateRefeshToken();
        const options = {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure:process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
        }

        return res.status(200).cookie("token", refreshToken, options).json({
            success: true,
            accessToken,
        })
    }catch(error){
        console.log(error);
        errors.general = "Something went wrong while logging in";
        return res.status(500).json({
            success: false,
            message: errors,
        });
    }
}

//TEST DASHBOARD
exports.dashboard = async (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to Foiti Dashboard",
    })
}