/*
  Warnings:

  - A unique constraint covering the columns `[mobile]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mobile` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "mobile" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Users_mobile_key" ON "Users"("mobile");
