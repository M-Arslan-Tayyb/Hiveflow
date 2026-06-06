import * as authService from "../../modules/auth/auth.service.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
const register = asyncHandler(async (req, res) => {
    const { fullName, email, password, inviteToken } = req.body;
    const user = await authService.registerUser({
        fullName,
        email,
        password,
        inviteToken,
    });
    res
        .status(201)
        .json(new ApiResponse(201, "User registered successfully", user));
});
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.loginUser({
        email,
        password,
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json(new ApiResponse(200, "Login successful", {
        user,
        accessToken,
        // refreshToken returned for testing in Postman;
        // production uses the secure http-only cookie above.
        refreshToken,
    }));
});
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res
        .status(200)
        .json(new ApiResponse(200, "Password reset email sent successfully"));
});
const refreshToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const { accessToken } = await authService.refreshAccessToken(token);
    res
        .status(200)
        .json(new ApiResponse(200, "Token refreshed successfully", { accessToken }));
});
const logout = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    await authService.logoutUser(token);
    // Clear cookie
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    res.status(200).json(new ApiResponse(200, "Logged out successfully"));
});
const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    await authService.resetPassword({ token, password });
    res.status(200).json(new ApiResponse(200, "Password reset successfully"));
});
const registerOwner = asyncHandler(async (req, res) => {
    const user = await authService.registerOwner(req.body);
    res
        .status(201)
        .json(new ApiResponse(201, "Owner registered successfully", user));
});
const verifyEmail = asyncHandler(async (req, res) => {
    await authService.verifyEmail(req.body);
    res.status(200).json(new ApiResponse(200, "Email verified successfully"));
});
const magicLinkLogin = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken, project } = await authService.magicLinkLogin(req.query.token);
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json(new ApiResponse(200, "Magic link login successful", {
        user,
        accessToken,
        refreshToken,
        project,
    }));
});
export { register, login, refreshToken, logout, forgotPassword, resetPassword, registerOwner, verifyEmail, magicLinkLogin, };
//# sourceMappingURL=auth.controller.js.map