import prisma from "@/config/db.js";
import ApiError from "@/utils/ApiError.js";

const authorSelect = {
  select: { id: true, fullName: true, email: true, avatar: true },
} as const;

interface CreateCommentInput {
  taskId: string;
  projectId: string;
  orgId: string;
  content: string;
  parentId?: string;
  authorId: string;
}

interface GetCommentsInput {
  taskId: string;
  projectId: string;
  orgId: string;
}

interface UpdateCommentInput {
  commentId: string;
  taskId: string;
  projectId: string;
  orgId: string;
  content: string;
  requestingUserId: string;
}

interface DeleteCommentInput {
  commentId: string;
  taskId: string;
  projectId: string;
  orgId: string;
  requestingUserId: string;
}

const createComment = async ({
  taskId,
  projectId,
  orgId,
  content,
  parentId,
  authorId,
}: CreateCommentInput) => {
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId, project: { orgId } } });
  if (!task) throw new ApiError(404, "Task not found");

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent) throw new ApiError(404, "Parent comment not found");
    if (parent.taskId !== taskId) throw new ApiError(400, "Parent comment does not belong to this task");
    if (parent.parentId !== null) throw new ApiError(400, "Cannot reply to a reply");
  }

  return prisma.comment.create({
    data: {
      content,
      taskId,
      authorId,
      parentId: parentId ?? null,
    },
    include: {
      author: authorSelect,
    },
  });
};

const getComments = async ({ taskId, projectId, orgId }: GetCommentsInput) => {
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId, project: { orgId } } });
  if (!task) throw new ApiError(404, "Task not found");

  return prisma.comment.findMany({
    where: { taskId, parentId: null },
    orderBy: { createdAt: "asc" },
    include: {
      author: authorSelect,
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: authorSelect },
      },
    },
  });
};

const updateComment = async ({
  commentId,
  taskId,
  projectId,
  orgId,
  content,
  requestingUserId,
}: UpdateCommentInput) => {
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId, project: { orgId } } });
  if (!task) throw new ApiError(404, "Task not found");

  const comment = await prisma.comment.findFirst({ where: { id: commentId, taskId } });
  if (!comment) throw new ApiError(404, "Comment not found");

  if (comment.authorId !== requestingUserId) {
    throw new ApiError(403, "You can only edit your own comment");
  }

  return prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: { author: authorSelect },
  });
};

const deleteComment = async ({
  commentId,
  taskId,
  projectId,
  orgId,
  requestingUserId,
}: DeleteCommentInput) => {
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId, project: { orgId } } });
  if (!task) throw new ApiError(404, "Task not found");

  const comment = await prisma.comment.findFirst({ where: { id: commentId, taskId } });
  if (!comment) throw new ApiError(404, "Comment not found");

  if (comment.authorId !== requestingUserId) {
    throw new ApiError(403, "You can only delete your own comment");
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return true;
};

export { createComment, getComments, updateComment, deleteComment };
