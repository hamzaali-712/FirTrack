export class ApiError extends Error {
  constructor(status, code, message, { fieldErrors, retryAfter } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.retryAfter = retryAfter;
  }
}
