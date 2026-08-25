export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("popsfood_admin_token");
}

async function request(path, { method = "GET", body, isForm = false, auth = false } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  if (!res.ok) {
    let detail = "Une erreur est survenue.";
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch (e) {
      // ignore
    }
    const error = new Error(detail);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path, auth = false) => request(path, { method: "GET", auth }),
  post: (path, body, auth = false) => request(path, { method: "POST", body, auth }),
  put: (path, body, auth = false) => request(path, { method: "PUT", body, auth }),
  del: (path, auth = false) => request(path, { method: "DELETE", auth }),
  postForm: (path, formData, auth = false) =>
    request(path, { method: "POST", body: formData, isForm: true, auth }),
};

export function imageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}
