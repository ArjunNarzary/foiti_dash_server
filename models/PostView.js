const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postViewSchema = new Schema({
    post: {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    user:{
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        immutable: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now(),
    },
});

//HASH PASSWORD
postViewSchema.pre("save", async function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("PostView", postViewSchema);