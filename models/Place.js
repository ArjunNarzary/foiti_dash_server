const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, "Name of place is required"],
      index: true,
    },
    google_place_id: {
      type: String,
      index: true,
    },
    // address: {
    //   route: String,
    //   natural_feature: String,
    //   neighborhood: String,
    //   sublocality_level_2: String,
    //   sublocality_level_1: String,
    //   locality: String,
    //   administrative_area_level_2: String,
    //   administrative_area_level_1: String,
    //   country: String,
    //   short_country: String,
    //   postal_code: String,
    //   premise: String,
    // },
    address:{},
    short_address: String,
    local_address: String,
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
      small: {
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
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        ceatedAt: {
          type: Date,
          default: Date.now,
          immutable: true,
        },
        updateAt: {
          type: Date,
          default: Date.now,
        },
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
    duplicate: {
      type: Boolean,
      default: false,
    },
    original_place_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
    },
    duplicate_place_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
    },
    created_place: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true });


//CALCULATE AVG RATING
placeSchema.virtual("avgRating").get(function () {
  if (this.review_id.length > 0) {
    let sum = 0;
    for (let i = 0; i < this.review_id.length; i++) {
      sum += this.review_id[i].rating;
    }
    return sum / this.review_id.length;
  }else{
    return 0;
  }
});

module.exports = mongoose.model("Place", placeSchema);
