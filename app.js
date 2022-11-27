const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN_URL.split(", "),
    credentials: true,
  })
);
//meddlewares
app.use(express.json());
app.use(cookieParser());
app.use(helmet());

// app.use(expressValidator);
//Routes Imports
const admin = require("./routes/team");
const request = require("./routes/joinRequest");
const post = require("./routes/post");
const user = require("./routes/user");
const place = require("./routes/place");
const image = require("./routes/image");
const website = require("./routes/website");
const type = require("./routes/type");
const versionUrl = "/api/v1";

//Use Routes
app.use(`${versionUrl}/admin`, admin);
app.use(`${versionUrl}/join`, request);
app.use(`${versionUrl}/post`, post);
app.use(`${versionUrl}/user`, user);
app.use(`${versionUrl}/place`, place);
app.use(`${versionUrl}/image`, image);
app.use(`${versionUrl}/website`, website);
app.use(`${versionUrl}/type`, type);

module.exports = app;
