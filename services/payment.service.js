const axios = require("axios");
const generatePaypalAccessToken = require("../utils/generatePaypalAccessToken");

const paypalPayment = async (req, res) => {
  const { access_token } = await generatePaypalAccessToken();

  // console.log(access_token);

  const response = await axios({
    url: process.env.PAYPAL_BASE_URL + "/v2/checkout/orders",
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + access_token,
    },
    data: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          items: [
            {
              name: "Node.js Complete Course",
              description: "Node.js Complete Course with Express and MongoDB",
              quantity: 1,
              unit_amount: {
                currency_code: "USD",
                value: "100.00",
              },
            },
          ],

          amount: {
            currency_code: "USD",
            value: "100.00",
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: "100.00",
              },
            },
          },
        },
      ],

      application_context: {
        return_url: process.env.BASE_URL + "/complete-order",
        cancel_url: process.env.BASE_URL + "/cancel-order",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        brand_name: "manfra.io",
      },
    }),
  });

  console.log(access_token, response.data);

  return {
    access_token,
    data: response.data,
  };
};

const PaymentService = { paypalPayment };

module.exports = PaymentService;
