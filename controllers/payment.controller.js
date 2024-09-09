const PaymentService = require("../services/payment.service");

const paypalPayment = async (req, res) => {
  try {
    const result = await PaymentService.paypalPayment();

    res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Paypal payment successful",
      data: result,
    });
  } catch (err) {
    console.log(err);
    res.send({ error: err.message });
  }
};

const PaymentController = { paypalPayment };

module.exports = PaymentController;
