const { validationResult } = require("express-validator");
const Contribution = require("../models/Contribution");
const Place = require("../models/Place");
const PlaceViewer = require("../models/PlaceViewer");
const Post = require("../models/Post");
const Review = require("../models/Review");
const User = require("../models/User");
const { getCountry } = require("../utils/getCountry");
const PlaceLocationViewer = require("../models/PlaceLocationViewer");
var ObjectId = require('mongoose').Types.ObjectId;

function createError(errors, validate) {
  const arrError = validate.array();
  errors[arrError[0].param] = arrError[0].msg;
  return errors;
}

//Search places
exports.searchPlace = async (req, res) => {
  try {
    const { place, count } = req.query;
    const trimedPlace = place.trim();

    const results = await Place.find({
      name: { $regex: `${trimedPlace}`, $options: "i" },
    }).limit(count);

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//Autocomplete places
exports.autocompletePlace = async (req, res) => {
  try {
    const { place, count } = req.query;
    const { ip } = req.headers;
    const trimedPlace = place.trim();
    console.log(ip);

    const results = await Place.find({
      name: { $regex: `${trimedPlace}`, $options: "i" },
    })
      .select("_id name address cover_photo short_address local_address types")
      .limit(count);

    //FORMAT ADDRESS
    let country = "";
    const location = await getCountry(ip);
    if (location != null && location.country !== undefined) {
      country = location.country;
    } else {
      country = "IN";
    }

    results.forEach((place) => {
      if (place.address.short_country == country) {
        place.local_address = place.display_address_for_own_country;
      } else {
        let state = "";
        if (
          place.address.administrative_area_level_1 != null &&
          place.types[0] != "administrative_area_level_1"
        ) {
          state = place.address.administrative_area_level_1;
        } else if (place.address.administrative_area_level_2 != null) {
          state = place.address.administrative_area_level_2;
        } else if (place.address.locality != null) {
          state = place.address.locality;
        } else if (place.address.sublocality_level_1 != null) {
          state = place.address.sublocality_level_1;
        } else if (place.address.sublocality_level_2 != null) {
          state = place.address.sublocality_level_2;
        } else if (place.address.neighborhood != null) {
          state = place.address.neighborhood;
        }
        if (state != "") {
          state = state + ", ";
        }

        place.short_address = state + place.address.country;
      }
    });

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getPlace = async (req, res) => {
  let errors = {};
  try {
    const { place_id } = req.params;
    const { authUser } = req.body;
    const { ip } = req.headers;

    //Validate Object ID
    if (!ObjectId.isValid(place_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid place ID",
      });
    }

    const place = await Place.findById(place_id).populate("review_id");
    // place.totalRating =

    if (!place) {
      errors.place = "Place not found";
      return res.status(404).json({
        success: false,
        error: errors,
      });
    }

    //Insert view in Place View table
    let placeViewer = await PlaceViewer.findOne({
      $and: [{ place: place._id }, { user: authUser._id }],
    });
    if (!placeViewer) {
      placeViewer = await PlaceViewer.create({
        place: place._id,
        user: authUser._id,
      });
      place.viewers.push(placeViewer._id);
      await place.save();
    }

    placeViewer.save();

    // format Type
    let formattedType = "";
    if (place.types.length > 0) {
      let type = place.types[0];
      const typeArr = type.split("_");
      const capitalizedType = typeArr.map((type) => {
        return type.charAt(0).toUpperCase() + type.slice(1);
      });
      formattedType = capitalizedType.join(" ");
    }

    //FORMAT ADDRESS
    let country = "";
    const location = await getCountry(ip);
    if (location != null && location.country !== undefined) {
      country = location.country;
    } else {
      country = "IN";
    }

    if (place.address.short_country == country) {
      place.local_address = place.display_address_for_own_country;
    } else {
      let state = "";
      if (
        place.address.administrative_area_level_1 != null &&
        place.types[0] != "administrative_area_level_1"
      ) {
        state = place.address.administrative_area_level_1;
      } else if (place.address.administrative_area_level_2 != null) {
        state = place.address.administrative_area_level_2;
      } else if (place.address.locality != null) {
        state = place.address.locality;
      } else if (place.address.sublocality_level_1 != null) {
        state = place.address.sublocality_level_1;
      } else if (place.address.sublocality_level_2 != null) {
        state = place.address.sublocality_level_2;
      } else if (place.address.neighborhood != null) {
        state = place.address.neighborhood;
      }
      if (state != "") {
        state = state + ", ";
      }

      place.short_address = state + place.address.country;
    }

    return res.status(200).json({
      success: true,
      place,
      formattedType,
      avgRating: place.avgRating,
    });
  } catch (error) {
    console.log(error);
    errors.general = "Something went wrong";
    return res.status(500).json({
      success: false,
      error: errors,
    });
  }
};

//ADD OR EDIT REVIEW
exports.addEditReview = async (req, res) => {
  let errors = {};
  try {
    const validate = validationResult(req);
    if (!validate.isEmpty()) {
      return res.status(400).json({
        success: false,
        // message: validate.array(),
        message: createError(errors, validate),
      });
    }

    const { place_id } = req.params;
    const { authUser, review, rating } = req.body;

    const place = await Place.findById(place_id);

    if (!place) {
      errors.place = "Place not found";
      return res.status(404).json({
        success: false,
        error: errors,
      });
    }

    let reviewModel = {};
    const reviewExists = await Review.findOne({})
      .where("user_id")
      .equals(authUser._id)
      .where("place_id")
      .equals(place_id);
    if (reviewExists) {
      reviewExists.body = review;
      reviewExists.rating = rating;
      await reviewExists.save();
      reviewModel = reviewExists;
    } else {
      reviewModel = await Review.create({
        user_id: authUser._id,
        place_id: place_id,
        body: review,
        rating: rating,
      });

      place.review_id.push(reviewModel._id);
      place.save();
    }

    //Add contribution
    //FIND CONTRIBUTION OR CREATE NEW
    let contribution = await Contribution.findOne({ userId: authUser._id });
    if (!contribution) {
      contribution = await Contribution({ userId: authUser._id });
    }
    let review_200_characters = review.length;
    //Add contribution for review
    if ((review_200_characters) => 200) {
      if (!contribution.review_200_characters.includes(reviewModel._id)) {
        contribution.review_200_characters.push(reviewModel._id);
      }
    } else {
      if (contribution.review_200_characters.includes(reviewModel._id)) {
        contribution.review_200_characters =
          contribution.review_200_characters.filter(
            (review) => review.toString() != reviewModel._id.toString()
          );
      }
    }

    if (!contribution.reviews.includes(reviewModel._id)) {
      contribution.reviews.push(reviewModel._id);
    }

    //Add contribution for rating
    if (rating != "" && rating != undefined) {
      if (!contribution.ratings.includes(reviewModel._id)) {
        contribution.ratings.push(reviewModel._id);
      }
    } else {
      if (contribution.ratings.includes(reviewModel._id)) {
        contribution.ratings = contribution.ratings.filter(
          (review) => review.toString() != reviewModel._id.toString()
        );
      }
    }

    await contribution.save();

    const user = await User.findById(authUser._id);
    user.total_contribution = contribution.calculateTotalContribution();
    await user.save();

    res.status(200).json({
      success: true,
      review: reviewModel,
    });
  } catch (error) {
    console.log(error);
    errors.general = "Something went wrong";
    return res.status(500).json({
      success: false,
      error: errors,
    });
  }
};

exports.getPlacePosts = async (req, res) => {
  let errors = {};
  try {
    const { place_id } = req.params;
    // let { skip, limit, extraSkip } = req.body;
    let { skip, limit } = req.body;

    const place = await Place.findById(place_id);
    if (!place) {
      errors.place = "Place not found";
      return res.status(404).json({
        success: false,
        error: errors,
      });
    }

    let posts = [];

    if (place.types[0] === "country") {
      const places = await Place.find({})
        .where("address.country")
        .equals(place.address.country)
        .populate("posts")
        .exec()
        .then(async (cPlace) => {
          cPlace.map((p) => {
            posts = [...posts, ...p.posts];
          });
        });
    } else if (place.types[0] === "administrative_area_level_1") {
      const places = await Place.find({})
        .where("address.administrative_area_level_1")
        .equals(place.address.administrative_area_level_1)
        .where("address.country")
        .equals(place.address.country)
        .populate("posts")
        .exec()
        .then(async (cPlace) => {
          cPlace.map((p) => {
            posts = [...posts, ...p.posts];
          });
        });
    } else if (place.types[0] === "administrative_area_level_2") {
      const places = await Place.find({})
        .where("address.administrative_area_level_2")
        .equals(place.address.administrative_area_level_2)
        .where("address.administrative_area_level_1")
        .equals(place.address.administrative_area_level_1)
        .where("address.country")
        .equals(place.address.country)
        .populate("posts")
        .exec()
        .then(async (cPlace) => {
          cPlace.map((p) => {
            posts = [...posts, ...p.posts];
          });
        });
    } else if (place.types[0] === "locality") {
      if (
        place.address.administrative_area_level_2 != "" ||
        place.address.administrative_area_level_2 !== undefined
      ) {
        const places = await Place.find({})
          .where("address.locality")
          .equals(place.address.locality)
          .where("address.administrative_area_level_2")
          .equals(place.address.administrative_area_level_2)
          .where("address.administrative_area_level_1")
          .equals(place.address.administrative_area_level_1)
          .where("address.country")
          .equals(place.address.country)
          .populate("posts")
          .exec()
          .then(async (cPlace) => {
            cPlace.map((p) => {
              posts = [...posts, ...p.posts];
            });
          });
      } else {
        const places = await Place.find({})
          .where("address.locality")
          .equals(place.address.locality)
          .where("address.administrative_area_level_1")
          .equals(place.address.administrative_area_level_1)
          .where("address.country")
          .equals(place.address.country)
          .populate("posts")
          .exec()
          .then((cPlace) => {
            cPlace.map((p) => {
              posts = [...posts, ...p.posts];
            });
          });
      }
    } else {
      posts = await Post.find({})
        .where("place")
        .equals(place_id)
        // .where("status").equals("active")
        .where("coordinate_status")
        .equals(true)
        .sort({ createdAt: -1 });
      // .limit(limit)
      // .skip(skip);
    }

    return res.status(200).json({
      success: true,
      posts,
      skip,
      // extraSkip,
    });
  } catch (error) {
    console.log(error);
    errors.general = "Something went wrong";
    return res.status(500).json({
      success: false,
      error: errors,
    });
  }
};

//ADD DIRECTION CLICKED DETAILS
exports.addPlaceLocationClickedDetails = async (req, res) => {
  let errors = {};
  try {
    const placeId = req.params.id;
    const { authUser } = req.body;
    const place = await Place.findById(placeId);

    if (!place) {
      errors.general = "Place not found";
      return res.status(404).json({
        success: false,
        message: errors,
      });
    }

    let locationClicked = await PlaceLocationViewer.findOne({
      $and: [{ place: placeId }, { user: authUser._id }],
    });

    if (!locationClicked) {
      locationClicked = await PlaceLocationViewer.create({
        place: placeId,
        user: authUser._id,
      });

      place.location_viewers.push(locationClicked._id);
      await place.save();
    }

    await locationClicked.save();

    return res.status(200).json({
      success: true,
      message: "Direction clicked details added",
    });
  } catch (error) {
    console.log(error);
    errors.general = "Something went wrong";
    return res.status(500).json({
      success: false,
      message: errors,
    });
  }
};
