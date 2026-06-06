/**
 * Standard success/response envelope returned by all controllers.
 */
class ApiResponse {
    success;
    statusCode;
    message;
    data;
    constructor(statusCode, message, data = null) {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}
export default ApiResponse;
//# sourceMappingURL=ApiResponse.js.map