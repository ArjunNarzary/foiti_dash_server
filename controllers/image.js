const User = require("../models/User");
const { getFileStream } = require("../utils/s3");

exports.getImage = async (req, res) => {
  const key = req.params.key;
  const readStream = getFileStream(key);

  readStream.pipe(res);
};
