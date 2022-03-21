const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, "Name of place is required"],
    },
    google_place_id: {
      type: String,
      index: true,
    },
    address: {
      natural_feature: String,
      neighborhood: String,
      sublocality_level_2: String,
      sublocality_level_1: String,
      locality: String,
      administrative_area_level_2: String,
      administrative_area_level_1: String,
      country: String,
      short_country: String,
      postal_code: String,
    },
    coordinates: {
      lat: String,
      lng: String,
    },
    types: [String],
    cover_photo: {
      large: {
        public_url: String,
        private_id: String,
      },
      thumbnail: {
        public_url: String,
        private_id: String,
      },
    },
    saved: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Save",
      },
    ],
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    email: String,
    phone_number: String,
    website: String,
    direction_clicked: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    review_id: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Place", placeSchema);
