const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

//meddlewares
app.use(express.json());

app.use(helmet());

// app.use(morgan("common"));

app.use(cors());

// app.use(expressValidator);
//Routes Imports
const user = require("./routes/user");

//Use Routes
app.use("/user", user);

module.exports = app;
