-- Columns already exist
-- Ajout des colonnes pour la réinitialisation de mot de passe
-- Note: Ces colonnes existent déjà en base, cette migration est pour l'historique

-- AlterTable
ALTER TABLE "User" ADD COLUMN "resetPasswordExpires" BIGINT;
ALTER TABLE "User" ADD COLUMN "resetPasswordToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "User"("resetPasswordToken");