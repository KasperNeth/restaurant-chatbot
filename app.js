const express = require("express");
const path = require("path");
const route = require("./src/routes/index.routes");

const app = express();


app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));
//api routes
app.use(route);


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server'
  });
});

module.exports = app;