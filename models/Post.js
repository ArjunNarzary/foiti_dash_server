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
    like: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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
    status: {
      type: String,
      enum: ["silent", "active", "deactivated"],
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

module.exports = mongoose.model("Post", postSchema);
