/**
 * forecastController.js
 * Xử lý các request liên quan đến dự báo Occupancy.
 */

const { trainModel, predictOccupancy, getModelStatus } = require("../services/aiService");

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
 * Body: { RoomSold, AvgRoomRate, RevPAR, RoomRev }
 */
async function predict(req, res) {
  try {
    const features = req.body;

    // Kiểm tra input 
    const required = ["RoomSold", "AvgRoomRate", "RevPAR", "RoomRev"];
    const missing = required.filter((f) => features[f] === undefined);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Thiếu các trường: ${missing.join(", ")}`,
      });
    }

    const result = await predictOccupancy(features);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("[Forecast] Lỗi predict:", err.message);

    if (err.cause?.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        message: "AI Service chưa chạy.",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
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

module.exports = { train, predict, status };