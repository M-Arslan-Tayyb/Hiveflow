import prisma from "@/config/db.js";
import ApiError from "@/utils/ApiError.js";

interface CreateBoardInput {
  projectId: string;
  orgId: string;
  name: string;
}

interface GetBoardsInput {
  projectId: string;
  orgId: string;
}

interface UpdateBoardInput {
  boardId: string;
  projectId: string;
  orgId: string;
  name: string;
}

interface UpdateBoardPositionInput {
  boardId: string;
  projectId: string;
  orgId: string;
  position: number;
}

interface DeleteBoardInput {
  boardId: string;
  projectId: string;
  orgId: string;
}

const getBoards = async ({ projectId, orgId }: GetBoardsInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  return prisma.board.findMany({
    where: { projectId },
    orderBy: { position: "asc" },
    include: {
      tasks: {
        orderBy: { position: "asc" },
        include: {
          assignee: { select: { id: true, fullName: true, email: true, avatar: true } },
          creator: { select: { id: true, fullName: true, email: true, avatar: true } },
        },
      },
    },
  });
};

const createBoard = async ({ projectId, orgId, name }: CreateBoardInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  const existingBoard = await prisma.board.findFirst({ where: { projectId, name } });
  if (existingBoard) throw new ApiError(409, "A board with this name already exists in the project");

  const lastBoard = await prisma.board.findFirst({
    where: { projectId },
    orderBy: { position: "desc" },
  });
  const position = lastBoard ? lastBoard.position + 1 : 1;

  return prisma.board.create({ data: { name, position, projectId } });
};

const updateBoard = async ({ boardId, projectId, orgId, name }: UpdateBoardInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  const board = await prisma.board.findFirst({ where: { id: boardId, projectId } });
  if (!board) throw new ApiError(404, "Board not found");

  const duplicateName = await prisma.board.findFirst({
    where: { projectId, name, id: { not: boardId } },
  });
  if (duplicateName) throw new ApiError(409, "A board with this name already exists in the project");

  return prisma.board.update({ where: { id: boardId }, data: { name } });
};

const updateBoardPosition = async ({
  boardId,
  projectId,
  orgId,
  position,
}: UpdateBoardPositionInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  const board = await prisma.board.findFirst({ where: { id: boardId, projectId } });
  if (!board) throw new ApiError(404, "Board not found");

  return prisma.$transaction(async (tx) => {
    const allBoards = await tx.board.findMany({
      where: { projectId },
      orderBy: { position: "asc" },
    });

    const clampedPosition = Math.min(position, allBoards.length);

    if (board.position === clampedPosition) {
      return tx.board.findUnique({ where: { id: boardId } });
    }

    const filteredBoards = allBoards.filter((b) => b.id !== boardId);
    filteredBoards.splice(clampedPosition - 1, 0, board);

    for (const [index, b] of filteredBoards.entries()) {
      await tx.board.update({ where: { id: b.id }, data: { position: index + 1 } });
    }

    return tx.board.findUnique({ where: { id: boardId } });
  });
};

const deleteBoard = async ({ boardId, projectId, orgId }: DeleteBoardInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  const board = await prisma.board.findFirst({
    where: { id: boardId, projectId },
    include: { _count: { select: { tasks: true } } },
  });
  if (!board) throw new ApiError(404, "Board not found");

  if (board._count.tasks > 0) {
    throw new ApiError(400, "Cannot delete a board that has tasks. Move or delete the tasks first.");
  }

  await prisma.board.delete({ where: { id: boardId } });
  return true;
};

export { getBoards, createBoard, updateBoard, updateBoardPosition, deleteBoard };
