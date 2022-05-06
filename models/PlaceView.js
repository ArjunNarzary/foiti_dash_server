const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const placeViewSchema = new Schema({
    place: {
        type: Schema.Types.ObjectId,
        ref: "Place",
        required: true,
    },
    user: {
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
placeViewSchema.pre("save", async function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("PlaceView", placeViewSchema);