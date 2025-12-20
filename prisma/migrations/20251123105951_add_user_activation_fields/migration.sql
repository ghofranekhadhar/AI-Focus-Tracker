/*
  Warnings:

  - A unique constraint covering the columns `[email,token]` on the table `invitations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."invitations_email_key";

-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "usedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "invitedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "invitations_email_token_key" ON "invitations"("email", "token");
