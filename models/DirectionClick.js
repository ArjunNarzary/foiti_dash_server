const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const directionClickSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: "Post",
  },
  place: {
    type: Schema.Types.ObjectId,
    ref: "Place",
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

//update date
postViewSchema.pre("save", async function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("DirectionClick", directionClickSchema);
