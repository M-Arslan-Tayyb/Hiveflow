/**
 * Operational error carrying an HTTP status code, handled by errorHandler.
 */
class ApiError extends Error {
    statusCode;
    isOperational;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
export default ApiError;
//# sourceMappingURL=ApiError.js.map