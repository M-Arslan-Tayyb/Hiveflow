import prisma from "../../config/db.js";
import ApiError from "../../utils/ApiError.js";
const createProject = async ({ orgId, name, description, creatorId, }) => {
    const project = await prisma.$transaction(async (tx) => {
        const newProject = await tx.project.create({
            data: { name, description, orgId },
        });
        await tx.projectMember.create({
            data: {
                userId: creatorId,
                projectId: newProject.id,
                role: "MANAGER",
            },
        });
        return newProject;
    });
    return project;
};
const getProjects = async ({ orgId }) => {
    const projects = await prisma.project.findMany({
        where: { orgId, isArchived: false },
        include: {
            members: {
                include: {
                    user: {
                        select: { id: true, fullName: true, email: true, avatar: true },
                    },
                },
            },
        },
    });
    return projects;
};
const getProject = async ({ projectId, orgId }) => {
    const project = await prisma.project.findFirst({
        where: { id: projectId, orgId },
        include: {
            members: {
                include: {
                    user: {
                        select: { id: true, fullName: true, email: true, avatar: true },
                    },
                },
            },
        },
    });
    if (!project) {
        throw new ApiError(404, "Project not found");
    }
    return project;
};
const updateProject = async ({ projectId, orgId, name, description, }) => {
    const project = await prisma.project.findFirst({
        where: { id: projectId, orgId },
    });
    if (!project) {
        throw new ApiError(404, "Project not found");
    }
    const data = {};
    if (name !== undefined)
        data.name = name;
    if (description !== undefined)
        data.description = description;
    const updated = await prisma.project.update({
        where: { id: projectId },
        data,
    });
    return updated;
};
const deleteProject = async ({ projectId, orgId }) => {
    const project = await prisma.project.findFirst({
        where: { id: projectId, orgId },
    });
    if (!project) {
        throw new ApiError(404, "Project not found");
    }
    await prisma.project.update({
        where: { id: projectId },
        data: { isArchived: true },
    });
    return true;
};
export { createProject, getProjects, getProject, updateProject, deleteProject };
//# sourceMappingURL=projects.service.js.map