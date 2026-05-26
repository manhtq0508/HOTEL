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

  let data = null;
  try {
    data = await response.json();
  } catch (_e) {
    data = null;
  }

  if (!response.ok) {
    const detail =
      data?.message ||
      data?.error ||
      (data ? JSON.stringify(data) : null) ||
      `AI Service lỗi khi train (HTTP ${response.status})`;
    throw new Error(detail);
  }

  return data;
}

/**
 * Dự báo Occupancy theo tuần, trả predicted_series (N tuần liên tục).
 * @param {number} count
 */
async function predictOccupancyWeekly(count = 24) {
  const url = new URL(`${AI_SERVICE_URL}/api/forecast/predict/weekly`);
  url.searchParams.set("count", String(count));

  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "AI Service lỗi khi predict weekly");
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
  predictOccupancyWeekly,
    getModelStatus,
};