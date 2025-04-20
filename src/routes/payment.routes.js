const Router = require('express').Router;
const { handleCallback } = require("../chat/controllers/payment.controller");

const route = Router();
route.get('/callback', handleCallback);

module.exports = route;