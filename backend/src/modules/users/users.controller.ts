import { Request, Response } from "express";
import * as usersService from "@/modules/users/users.service.js";
import ApiResponse from "@/utils/ApiResponse.js";
import ApiError from "@/utils/ApiError.js";
import asyncHandler from "@/utils/asyncHandler.js";

const lookupUser = asyncHandler(async (req: Request, res: Response) => {
  const email = req.query.email as string | undefined;
  if (!email) throw new ApiError(400, "email query parameter is required");

  const result = await usersService.lookupUserByEmail(email);
  res.status(200).json(new ApiResponse(200, "User lookup successful", result));
});

export { lookupUser };
