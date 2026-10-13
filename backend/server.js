const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.post("/login", (req, res) => {
  res.json({ message: "Login successful" });
});

app.post("/register", (req, res) => {
  res.json({ message: "Register successful" });
});

app.listen(5000,"0.0.0.0", () => {
  console.log("Server running on http://localhost:5000");
});

module.exports = app;