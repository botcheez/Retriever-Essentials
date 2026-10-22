// API helper: ONE place that knows the backend address and how to talk to it.
// Pages call get/post/upload instead of writing their own fetch().

// Change the address here (or set REACT_APP_API_URL in a .env file).
// NOTE: the backend defaults to port 3000, the same as this React app,
// so start the backend on another port (e.g. 5000) when running both.
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Must match the key used in AuthContext.jsx
const STORAGE_KEY = "auth";

function getToken() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))?.token || null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const headers = { ...options.headers };

  // If we're logged in, attach the token so protected backend routes accept us.
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE_URL + path, { ...options, headers });

  // Try to read the JSON body (it may be empty on some errors)
  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  // fetch does NOT throw on 400/401/500, so we do it ourselves.
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data;
}

export function get(path) {
  return request(path);
}

export function post(path, body) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// For file uploads: pass a FormData object. We must NOT set Content-Type
// ourselves, the browser sets it (with the file boundary) automatically.
export function upload(path, formData) {
  return request(path, { method: "POST", body: formData });
}
