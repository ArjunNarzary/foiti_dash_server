const UsageTime = require("../models/UsageTime");
const moment = require("moment")


function stringToTimestamp(dateString) {
    var date = new Date(dateString);
    var yr = date.getFullYear();
    var mo = date.getMonth() + 1;
    var day = date.getDate();

    var hours = date.getHours();
    var hr = hours < 10 ? '0' + hours : hours;

    var minutes = date.getMinutes();
    var min = (minutes < 10) ? '0' + minutes : minutes;

    var seconds = date.getSeconds();
    var sec = (seconds < 10) ? '0' + seconds : seconds;

    var newDateString = yr + '-' + mo + '-' + day;
    var newTimeString = hr + ':' + min + ':' + sec;

    var excelDateString = newDateString + ' ' + newTimeString;
    return new Date(excelDateString);
}



exports.userSession = async (req, res) => {
    let  errors = {};
    try{
        const { startDate, endDate } = req.body;

        const startDateEnd = moment(new Date(endDate)).startOf("day").toDate()
        const startDateStart = moment(new Date(startDate)).endOf("day").toDate()

        const sessions = await UsageTime.aggregate([
          {
            $match: {
              createdAt: { $gte: startDateStart, $lte: new Date(startDateEnd) },
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $group: {
              _id: { user: "$user" },
              version: { $first: "$appVersion" },
              totalSession: { $sum: "$totalTime" },
              count: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "_id.user",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $project: {
              _id: 1,
              totalSession: 1,
              count: 1,
              version: 1,
              "user._id": 1,
              "user.name": 1,
              "user.createdAt": 1,
            },
          },
        ])

        return res.status(200).json({
            sessions
        })
    }catch(error){
        console.log(error);
        res.status(500).json({
            success: false,
            message: errors.message
        })
    }
}