const mongoose = require("mongoose");

const contributionSchema = new mongoose.Schema({
  place: Number,
  post: Number,
  comment: Number,
  direction: Number,
  feedback: Number,
  share: Number,
});

module.exports = mongoose.model("Contribution", contributionSchema);
