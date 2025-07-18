/*
  Warnings:

  - Added the required column `userStatus` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INPROGRESS', 'VERIFIED', 'BANNED');

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "userStatus" "UserStatus" NOT NULL;
