const axios = require("axios");
require("dotenv").config();

const generatePaypalAccessToken = async () => {
  const res = await axios({
    url: process.env.PAYPAL_BASE_URL + "/v1/oauth2/token",
    method: "post",
    data: "grant_type=client_credentials",
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_CLIENT_SECRET,
    },
  });
  return res.data;
};

module.exports = generatePaypalAccessToken;
