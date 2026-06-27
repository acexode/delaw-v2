// Consistent API error shape: { error, message, statusCode }.
export class AppError extends Error {
  readonly statusCode: number;
  readonly error: string;

  constructor(statusCode: number, error: string, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.error = error;
  }
}

export const badRequest = (message: string) =>
  new AppError(400, "Bad Request", message);
export const unauthorized = (message = "Authentication required") =>
  new AppError(401, "Unauthorized", message);
export const forbidden = (message = "Forbidden") =>
  new AppError(403, "Forbidden", message);
export const notFound = (message = "Not Found") =>
  new AppError(404, "Not Found", message);
export const conflict = (message: string) =>
  new AppError(409, "Conflict", message);
export const tooManyRequests = (message = "Too many requests") =>
  new AppError(429, "Too Many Requests", message);
