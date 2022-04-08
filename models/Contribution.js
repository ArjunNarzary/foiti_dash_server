const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const contributionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    photos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    places: [
      {
        type: Schema.Types.ObjectId,
        ref: "Place",
      },
    ],
    added_places: [
      {
        type: Schema.Types.ObjectId,
        ref: "Place",
      },
    ],
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    review_200_characters: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    ratings: [
      {
        type: Schema.Types.ObjectId,
        ref: "Rating",
      },
    ],
    reports: [
      {
        type: Schema.Types.ObjectId,
        ref: "Report",
      },
    ],
    edits: [
      {
        type: Schema.Types.ObjectId,
        ref: "Edit",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contribution", contributionSchema);
