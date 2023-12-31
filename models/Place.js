const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: "Point",
  },
  coordinates: {
    type: [Number], // Array of arrays of arrays of numbers
  }
});

const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, "Name of place is required"],
      index: true,
    },
    //This will be the copy of original place name to show in app
    display_name: String,  
    //This array will be used to search for the place, will be manually added by team
    alias: [String],
    google_place_id: {
      type: String,
      require: [true, "Please select valid location"],
      index: true,
      unique: true,
    },
    // Google address formats: {
    //   route: String,
    //   natural_feature: String,
    //   neighborhood: String, <---
    //   sublocality_level_2: String, <---
    //   sublocality_level_1: String, <--- 
    //   locality: String,
    //   administrative_area_level_3: String,  <---
    //   administrative_area_level_2: String,
    //   administrative_area_level_1: String,
    //   country: String,
    //   short_country: String,
    //   postal_code: String,  <----
    //   premise: String,
    // },
    address: {},
    //If display_address_availaible true show this address
    display_address: {
      locality: String,
      sublocality: String,
      premise: String, //manual
      admin_area_3: String,  //manual
      admin_area_2: String,  //District name -> google_admin_area_3
      admin_area_1: String, //State name
      country: String,
      short_country: String,
    },
    //This is used to check if display address is available or not
    display_address_available: {
      type: Boolean,
      default: false,
    },
    //Address to show for other country
    short_address: String,
    //Address to show for own country
    local_address: String,
    coordinates: {
      lat: String,
      lng: String,
    },
    location: {
      type: pointSchema,
      index: '2dsphere', // Create a special 2dsphere index
      sparse: true
    },
    google_types: [String],
    //Custom type to show in type field ["Category-> will be used in filtering", "Display in type field"]
    types: [String],
    //Search rank for sorting search results
    search_rank: {
      type: Number,
      default: 0,
    },
    //Score to sort popular places
    editor_rating: {
      type: Number,
      default: 0,
    },
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
    open_hours: [],
    saved: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Save",
      },
    ],
    //This will be User objectId -> owner of the business or place
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    email: String,
    phone_number: String,
    website: String,
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlaceViewer",
      },
    ],
    viewers_count: Number,
    location_viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlaceLocationViewer",
      },
    ],
    location_viewers_count: Number,
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
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    //This will be used to check if place is duplicate or not
    duplicate: {
      type: Boolean,
      default: false,
    },
    //If duplicate place then this will be place ID of original place
    original_place_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
    },
    //If this place has duplicate places then this will be array of place IDs
    duplicate_place_id: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Place",
      },
    ],
    //If this place is created by user then this will be true addrss will be taken from image coordinates
    created_place: {
      type: Boolean,
      default: false,
    },
    //If this place is reviewed by team then this will be true
    reviewed_status: {
      type: Boolean,
      default: false,
    },
    review_required: {
      type: Boolean,
      default: false,
    },
    destination: {
      type: Boolean,
      default: false,
    },
    show_destinations: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

//SET VIRTUAL FOR DISPLAYING ADDRESS FOR OWN COUNTRY
placeSchema.virtual("display_address_for_share").get(function () {
  let addressArr = [];

  if (this.display_address_available) {
    if (this.display_address.admin_area_1) {
      addressArr.push(this.display_address.admin_area_1);
    }

    if (this.display_address.sublocality) {
      addressArr.push(this.display_address.sublocality);
    } else if (this.display_address.locality) {
      addressArr.push(this.display_address.locality);
    }
  } else {
    if (
      this.address.administrative_area_level_1 != this.name &&
      this.address.administrative_area_level_1 != undefined
    ) {
      addressArr.push(this.address.administrative_area_level_1);
    }

    if (
      this.address.locality != undefined &&
      this.address.locality != this.name
    ) {
      addressArr.push(this.address.locality);
    }
     else if (
      this.address.sublocality_level_1 != undefined &&
      this.address.sublocality_level_1 != this.name
    ) {
      addressArr.push(this.address.sublocality_level_1);
    } else if (
      this.address.sublocality_level_2 != undefined &&
      this.address.sublocality_level_2 != this.name
    ) {
      addressArr.push(this.address.sublocality_level_2);
    }
  }
  // console.log("arr", addressArr);

  let reverseArr = [];
  if (addressArr.length != 0) {
    reverseArr = addressArr.reverse();
  }

  let address = "";
  if (reverseArr.length != 0) {
    address = reverseArr.join(", ");
  }

  return address;
});

//SET VIRTUAL FOR DISPLAYING ADDRESS FOR OWN COUNTRY
placeSchema.virtual("display_address_to_show_on_user").get(function () {
  let addressArr = [];

  if (this.display_address_available) {
    if (this.display_address.admin_area_1) {
      addressArr.push(this.display_address.admin_area_1);
    }
  } else {
    if (
      this.address.administrative_area_level_1 != this.name &&
      this.address.administrative_area_level_1 != undefined
    ) {
      addressArr.push(this.address.administrative_area_level_1);
    }

  }

  //Add place name
  if (this.display_name) {
    addressArr.push(this.display_address)
  } else {
    addressArr.push(this.name)
  }

  let address = addressArr.reverse().join(", ");

  return address;
});

//Update view count
placeSchema.pre("save", function (next) {
  if (this.isModified("viewers")) {
    this.viewers_count = this.viewers.length;
  }
  if (this.isModified("location_viewers")) {
    this.location_viewers_count = this.location_viewers.length;
  }
  next();
});

module.exports = mongoose.model("Place", placeSchema);
