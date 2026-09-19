/** Thrown inside route handlers to attach an HTTP status to a plain Error. */
export interface HttpError extends Error {
  status?: number;
}

export function httpError(message: string, status: number): HttpError {
  return Object.assign(new Error(message), { status });
}
