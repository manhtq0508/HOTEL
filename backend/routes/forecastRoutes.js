const express = require("express");
const router = express.Router();
const { train, predict, status } = require("../controllers/forecastController");

router.post("/train", train);
router.post("/predict", predict);
router.get("/status", status);

module.exports = router;