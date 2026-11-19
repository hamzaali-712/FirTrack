export class ApiClientError extends Error {
  constructor({ status, code, message, fieldErrors = [] }) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiRequest(path, { method = "GET", body, csrfToken } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

  const response = await fetch(`/api/v1${path}`, {
    method,
    credentials: "include",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return null;

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ApiClientError({
      status: response.status,
      code: "INVALID_RESPONSE",
      message: "The server returned an unreadable response. Please try again.",
    });
  }

  if (!response.ok) {
    throw new ApiClientError({
      status: response.status,
      code: payload?.error?.code ?? "REQUEST_FAILED",
      message: payload?.error?.message ?? "The request could not be completed.",
      fieldErrors: payload?.error?.fieldErrors ?? [],
    });
  }
  return payload.data;
}

export function getCsrfToken() {
  return apiRequest("/auth/csrf").then((data) => data.csrfToken);
}
