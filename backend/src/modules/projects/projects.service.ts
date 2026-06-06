import { Prisma } from "@prisma/client";
import prisma from "@/config/db.js";
import ApiError from "@/utils/ApiError.js";

interface CreateProjectInput {
  orgId: string;
  name: string;
  description?: string;
  creatorId: string;
}

interface GetProjectsInput {
  orgId: string;
}

interface GetProjectInput {
  projectId: string;
  orgId: string;
}

interface UpdateProjectInput {
  projectId: string;
  orgId: string;
  name?: string;
  description?: string;
}

interface DeleteProjectInput {
  projectId: string;
  orgId: string;
}

const createProject = async ({
  orgId,
  name,
  description,
  creatorId,
}: CreateProjectInput) => {
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

    await tx.board.createMany({
      data: [
        { name: "Todo", position: 1, projectId: newProject.id },
        { name: "In Progress", position: 2, projectId: newProject.id },
        { name: "Done", position: 3, projectId: newProject.id },
      ],
    });

    return newProject;
  });

  return project;
};

const getProjects = async ({ orgId }: GetProjectsInput) => {
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

const getProject = async ({ projectId, orgId }: GetProjectInput) => {
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

const updateProject = async ({
  projectId,
  orgId,
  name,
  description,
}: UpdateProjectInput) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const data: Prisma.ProjectUpdateInput = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;

  const updated = await prisma.project.update({
    where: { id: projectId },
    data,
  });

  return updated;
};

const deleteProject = async ({ projectId, orgId }: DeleteProjectInput) => {
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
