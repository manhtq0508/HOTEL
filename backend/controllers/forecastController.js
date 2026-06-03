/**
 * forecastController.js
 * Xử lý các request liên quan đến dự báo Occupancy.
 */

const { trainModel, predictOccupancy, getModelStatus, getForecastHistory } = require("../services/aiService");

/**
 * POST /api/forecast/train
 */
async function train(req, res) {
  try {
    console.log("[Forecast] Bắt đầu train model...");
    const result = await trainModel();
    console.log("[Forecast] Train xong:", result.metrics);

    return res.json({
      success: true,
      message: "Train model thành công!",
      data: result,
    });
  } catch (err) {
    console.error("[Forecast] Lỗi train:", err.message);

    // AI Service không chạy
    if (err.cause?.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        message: "AI Service chưa chạy. Hãy start Flask server.",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/**
 * POST /api/forecast/predict
 */
async function predict(req, res) {
  try {
    const result = await predictOccupancy(); 
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("[Forecast] Lỗi predict:", err.message);
    if (err.cause?.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        message: "AI Service chưa chạy.",
      });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/forecast/status
 * Kiểm tra model đã train chưa, xem metrics.
 */
async function status(req, res) {
  try {
    const result = await getModelStatus();
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("[Forecast] Lỗi status:", err.message);

    if (err.cause?.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        message: "AI Service chưa chạy.",
      });
    }

    return res.status(500).json({ success: false, message: err.message });
  }
}

async function forecastHistory(req, res) {
  try {
    const result = await getForecastHistory();
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("[Forecast] Lỗi history:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { train, predict, status, forecastHistory };