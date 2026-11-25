export async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: options.body ? { "content-type": "application/json", ...(options.headers || {}) } : options.headers,
    ...options
  });
  let data;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) {
    const error = new Error(data?.message || `Permintaan gagal (${response.status})`);
    error.code = data?.code;
    error.status = response.status;
    throw error;
  }
  return data;
}

export function get(path) { return api(path); }
export function post(path, body) { return api(path, { method: "POST", body: JSON.stringify(body || {}) }); }
export function patch(path, body) { return api(path, { method: "PATCH", body: JSON.stringify(body || {}) }); }
export function put(path, body) { return api(path, { method: "PUT", body: JSON.stringify(body || {}) }); }
export function del(path) { return api(path, { method: "DELETE" }); }
