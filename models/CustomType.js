const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const customTypeSchema = new Schema(
    {
        display_type: String,
        type: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model("CustomType", customTypeSchema);
