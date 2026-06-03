const express = require("express");
const router = express.Router();
const { train, predict, status, forecastHistory } = require("../controllers/forecastController");

router.post("/train", train);
router.post("/predict", predict);
router.get("/status", status);
router.get("/history",   forecastHistory);

module.exports = router;