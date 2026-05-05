/**
 * aiService.js
 * Chịu trách nhiệm gọi HTTP đến AI Service (Flask).
 * Controller không cần biết Flask ở đâu, chỉ cần gọi hàm từ file này.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Gọi AI Service để train model SVR+GA.
 * Quá trình này mất ~2 phút, nên timeout phải dài.
 */
async function trainModel() {
    const response = await fetch(`${AI_SERVICE_URL}/api/forecast/train`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5 * 60 * 1000), // 5 phút
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "AI Service lỗi khi train");
    }

    return data;
}

/**
 * Gọi AI Service để dự đoán Occupancy.
 * @param {Object} features - { RoomSold, AvgRoomRate, RevPAR, RoomRev }
 */
async function predictOccupancy(features) {
  const response = await fetch(`${AI_SERVICE_URL}/api/forecast/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(features),
    signal: AbortSignal.timeout(30_000), // timeout 30 giây
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "AI Service lỗi khi predict");
  }

  return data;
}

/**
 * Lấy thông tin model hiện tại (đã train chưa, metrics, params).
 */
async function getModelStatus() {
  const response = await fetch(`${AI_SERVICE_URL}/api/forecast/status`, {
    signal: AbortSignal.timeout(10_000),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "AI Service lỗi khi lấy status");
  }

  return data;
}

module.exports = {
    trainModel,
    predictOccupancy,
    getModelStatus,
};