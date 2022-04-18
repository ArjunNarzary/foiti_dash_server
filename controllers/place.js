const { validationResult } = require("express-validator");
const Place = require("../models/Place");
const Post = require("../models/Post");
const Review = require("../models/Review");

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
    const trimedPlace = place.trim();

    const results = await Place.find({
      name: { $regex: `${trimedPlace}`, $options: "i" },
    })
      .select("_id name address cover_photo")
      .limit(count);

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
    const place = await Place.findById(place_id).populate("review_id");
    // place.totalRating =

    if (!place) {
      errors.place = "Place not found";
      return res.status(404).json({
        success: false,
        error: errors,
      });
    }

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

    return res.status(200).json({
      success: true,
      place,
      formattedType,
      avgRating: place.avgRating,
    });
  } catch (error) {
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
      console.log("country");
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
      console.log("administrative_area_level_1");
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
      console.log("administrative_area_level_2");
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
        console.log("locality");
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
        console.log("locality");
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
      console.log("neighborhood");
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
