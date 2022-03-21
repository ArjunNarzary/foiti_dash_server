const mongoose = require("mongoose");

const savePostSchema = new mongoose.Schema({});

module.exports = mongoose.model("SavePost", savePostSchema);
