const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    name: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
    },
    content: [
      {
        image: {
          thumbnail: {
            public_url: String,
            private_id: String,
          },
          small: {
            public_url: String,
            private_id: String,
          },
          large: {
            public_url: String,
            private_id: String,
          },
        },
        coordinate: {
          lat: String,
          lng: String,
        },
        type: {
          type: String,
          enum: ["video", "image"],
          default: "image",
        },
      },
    ],
    caption: {
      type: String,
      maxlength: [1000, "Caption should be maximum of 1000 characters"],
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    comment_status: {
      type: Boolean,
      default: true,
    },
    saved: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    coordinate_status: {
      type: Boolean,
      default: false,
    },
    direction_clicked: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DirectionClick",
      },
    ],
    direction_clicked_count: Number,
    like: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    like_count: Number,
    view: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PostView",
      },
    ],
    view_count: Number,
    status: {
      type: String,
      enum: ["silent", "active", "deactivated", "blocked"],
    },
    terminated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

//CHECK IF LIKED
postSchema.methods.hasLiked = async function (id) {
  return this.like.includes(id);
};

//CHECK IF COUNTRY IS SAME
// postSchema.methods.sameCountry = async function (country) {
//   return this.place.country === country;
// }

//SET VIRTUAL TO SET SAME COUNTRY
//SET VIRTUAL FOR FOLLOWING COUNT
postSchema.virtual("display_address_for_own_country").get(function () {
  let address =
    this.place.types[0] != "administrative_area_level_1"
      ? this.place.address.administrative_area_level_1
      : "";
  if (
    this.place.address.administrative_area_level_2 != undefined &&
    this.place.address.administrative_area_level_2 != this.place.name
  ) {
    address = this.place.address.administrative_area_level_2 + ", " + address;
  } else if (
    this.place.address.natural_feature != undefined &&
    this.place.address.natural_feature != this.place.name
  ) {
    address = this.place.address.natural_feature + ", " + address;
  } else if (
    this.place.address.sublocality_level_1 != undefined &&
    this.place.address.sublocality_level_1 != this.place.name
  ) {
    address = this.place.address.sublocality_level_1 + ", " + address;
  } else if (
    this.place.address.sublocality_level_2 != undefined &&
    this.place.address.sublocality_level_2 != this.place.name
  ) {
    address = this.place.address.sublocality_level_2 + ", " + address;
  } else if (
    this.place.address.locality != undefined &&
    this.place.address.locality != this.place.name
  ) {
    address = this.place.address.locality + ", " + address;
  }
  return address;
});

//Update like count
postSchema.pre("save", function (next) {
  if (this.isModified("view")) {
    this.view_count = this.view.length;
  }
  if (this.isModified("like")) {
    this.like_count = this.like.length;
  }
  if (this.isModified("direction_clicked")) {
    this.direction_clicked_count = this.direction_clicked.length;
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);
