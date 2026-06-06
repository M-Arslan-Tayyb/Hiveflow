/**
 * Wraps an async route handler and forwards rejected promises to next().
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
export default asyncHandler;
//# sourceMappingURL=asyncHandler.js.map