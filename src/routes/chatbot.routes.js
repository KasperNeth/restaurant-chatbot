const Router = require('express').Router;
const { processMessage, startChat } = require("../chat/controllers/chatbot.controller");

const route = Router();
route.post("/", processMessage);
route.get("/start", startChat);

module.exports = route;