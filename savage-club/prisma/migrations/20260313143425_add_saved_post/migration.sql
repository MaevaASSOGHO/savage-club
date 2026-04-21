/*
  Warnings:

  - You are about to drop the column `savedAt` on the `SavedPost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SavedPost" DROP COLUMN "savedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "SavedPost_userId_idx" ON "SavedPost"("userId");

-- CreateIndex
CREATE INDEX "SavedPost_postId_idx" ON "SavedPost"("postId");
