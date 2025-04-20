const Router = require('express').Router;
const chatRoute = require("./chatbot.routes");
const paymentRoute = require("./payment.routes");

const route = Router();

route.use("/api/chat", chatRoute);
route.use("/api/payment", paymentRoute);

module.exports = route;