-- CreateIndex
CREATE INDEX "Board_projectId_position_idx" ON "Board"("projectId", "position");

-- CreateIndex
CREATE INDEX "Task_boardId_position_idx" ON "Task"("boardId", "position");
