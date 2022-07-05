const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const foitiTeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: [true, "Please enter your email"],
        unique: [true, "Email already exist"],
        lowercase: true,
    },
    username: {
        type: String,
        required: true,
        unique: [true, "Username has already been taken"],
        lowercase: true,
        sparse: true,
    },
    password: {
        type: String,
        required: [true, "Plase enter a password"],
        minlength: [8, "Password should be minimum 8 characters"],
        select: false,
    },
    designation: String,
    tokenVersion: {
        type: Number,
        default: 0,
    }
},{timestamps:true});

//HASH PASSWORD
foitiTeamSchema.pre("save", async function (next) {
    this.updatedAt = Date.now();
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

//MATCH PASSWORD
foitiTeamSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

//GENEARATE ACCESS TOKEN
foitiTeamSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { _id: this._id, email: this.email },
        process.env.ACCESS_JWT_SECRET,
        {
            expiresIn: "15m",
        }
    );
};

//GENEARATE REFRESH TOKEN
foitiTeamSchema.methods.generateRefeshToken = function () {
    return jwt.sign(
        { _id: this._id, email: this.email, tokenVersion: this.tokenVersion },
        process.env.REFRESH_JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

module.exports = mongoose.model("FoitiTeam", foitiTeamSchema);
