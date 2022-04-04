const geoip = require("geoip-country");

exports.getCountry = (ip) => {
  // ip = ip || "223.238.101.187";
  const country = geoip.lookup(ip);
  return country;
};
