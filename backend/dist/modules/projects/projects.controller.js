import * as projectService from "../../modules/projects/projects.service.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
const createProject = asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const { name, description } = req.body;
    const project = await projectService.createProject({
        orgId,
        name,
        description,
        creatorId: req.user.id,
    });
    res
        .status(201)
        .json(new ApiResponse(201, "Project created successfully", project));
});
const getProjects = asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const projects = await projectService.getProjects({ orgId });
    res
        .status(200)
        .json(new ApiResponse(200, "Projects fetched successfully", projects));
});
const getProject = asyncHandler(async (req, res) => {
    const { orgId, projectId } = req.params;
    const project = await projectService.getProject({ projectId, orgId });
    res
        .status(200)
        .json(new ApiResponse(200, "Project fetched successfully", project));
});
const updateProject = asyncHandler(async (req, res) => {
    const { orgId, projectId } = req.params;
    const { name, description } = req.body;
    const project = await projectService.updateProject({
        projectId,
        orgId,
        name,
        description,
    });
    res
        .status(200)
        .json(new ApiResponse(200, "Project updated successfully", project));
});
const deleteProject = asyncHandler(async (req, res) => {
    const { orgId, projectId } = req.params;
    await projectService.deleteProject({ projectId, orgId });
    res.status(200).json(new ApiResponse(200, "Project deleted successfully"));
});
export { createProject, getProjects, getProject, updateProject, deleteProject };
//# sourceMappingURL=projects.controller.js.map