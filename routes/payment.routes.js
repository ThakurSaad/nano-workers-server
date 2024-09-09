const { Router } = require("express");

const router = Router();
const PaymentController = require("../controllers/payment.controller");

router.post("/paypal/complete-order", PaymentController.paypalPayment);

module.exports = router;
