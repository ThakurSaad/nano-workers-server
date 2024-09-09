const express = require("express");
const router = express.Router();
const PaymentRoutes = require("./payment.routes");

const moduleRoutes = [
  {
    path: "/payment",
    route: PaymentRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

module.exports = router;
