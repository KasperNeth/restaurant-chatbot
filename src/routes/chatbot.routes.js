const Router = require('express').Router;
const { processMessages, startChat } = require("../chat/controllers/chatbot.controller");

const route = Router();
route.post("/", processMessages);
route.get("/start", startChat);

module.exports = route;