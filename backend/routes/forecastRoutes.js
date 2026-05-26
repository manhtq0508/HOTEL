const express = require("express");
const router = express.Router();
const { train, predictWeekly, status } = require("../controllers/forecastController");

router.post("/train", train);
router.get("/predict/weekly", predictWeekly);
router.get("/status", status);

module.exports = router;