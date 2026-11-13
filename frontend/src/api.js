
const API_BASE_URL = "http://localhost:5000/api";

// Common helper for handling API responses
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

// Add authentication token to protected requests
function authHeaders(token) {
  if (!token) {
    throw new Error("Please log in first.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// --------------------------------------------------
// CROP PRICE APIs
// --------------------------------------------------

export async function getCrops() {
  const data = await apiRequest("/crops");
  return data.crops;
}

export async function getCrop(name) {
  const data = await apiRequest(
    `/crops/${encodeURIComponent(name)}`
  );

  return data.crop;
}

// --------------------------------------------------
// SMART SELL API
// --------------------------------------------------

export async function estimateCropValue(cropName, quantityKg) {
  return apiRequest("/smart-sell", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cropName,
      quantityKg: Number(quantityKg),
    }),
  });
}

// --------------------------------------------------
// USER AUTHENTICATION APIs
// --------------------------------------------------

export async function signupUser(userDetails) {
  return apiRequest("/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userDetails),
  });
}

export async function loginUser(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function getCurrentUser(token) {
  return apiRequest("/auth/me", {
    headers: authHeaders(token),
  });
}

// --------------------------------------------------
// CROP LOT APIs
// --------------------------------------------------

export async function createCropLot(token, cropLotDetails) {
  return apiRequest("/crop-lots", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(cropLotDetails),
  });
}

export async function getMyCropLots(token) {
  const data = await apiRequest("/crop-lots", {
    headers: authHeaders(token),
  });

  const lots = data.cropLots ?? data.lots ?? data.data ?? [];

  if (!Array.isArray(lots)) {
    throw new Error("Invalid crop listings response from server.");
  }

  return lots;
}

export async function updateCropLot(token, lotId, updates) {
  return apiRequest(`/crop-lots/${encodeURIComponent(lotId)}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(updates),
  });
}

export async function deleteCropLot(token, lotId) {
  return apiRequest(`/crop-lots/${encodeURIComponent(lotId)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}
