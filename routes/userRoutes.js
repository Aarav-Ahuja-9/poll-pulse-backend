const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controller/userController");


router.post("/signup", registerUser);


if (typeof loginUser === "function") {
  router.post("/login", loginUser);
}

module.exports = router;
