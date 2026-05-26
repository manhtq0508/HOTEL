/**
 * forecastController.js
 * Xử lý các request liên quan đến dự báo Occupancy.
 */

const { trainModel, predictOccupancyWeekly, getModelStatus } = require("../services/aiService");

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
 * GET /api/forecast/predict/weekly?count=24
 * Trả predicted_series theo tuần (AI service tự load/forecast).
 */
async function predictWeekly(req, res) {
  try {
    const count = Number(req.query.count ?? 24);
    const safeCount = Number.isFinite(count) ? count : 24;
    const result = await predictOccupancyWeekly(safeCount);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("[Forecast] Lỗi predictWeekly:", err.message);

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

module.exports = { train, predictWeekly, status };