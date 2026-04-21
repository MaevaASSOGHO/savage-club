-- AlterTable
ALTER TABLE "User" ADD COLUMN     "category" TEXT,
ADD COLUMN     "idDocumentUrl" TEXT,
ADD COLUMN     "idVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "subscriptionPrice" INTEGER,
ADD COLUMN     "subscriptionVIP" INTEGER,
ADD COLUMN     "website" TEXT;
