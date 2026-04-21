/*
  Warnings:

  - You are about to drop the column `image` on the `Post` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'GALLERY');

-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'SUBSCRIBERS', 'PAID');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "image",
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mediaType" "MediaType",
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "price" INTEGER,
ADD COLUMN     "status" "PostStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC',
ALTER COLUMN "content" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_postId_type_key" ON "Reaction"("userId", "postId", "type");

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
