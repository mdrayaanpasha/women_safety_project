/*
  Warnings:

  - Added the required column `legalVolunteerStatus` to the `Dispatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mentalVolunteerStatus` to the `Dispatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `policeVolunteerStatus` to the `Dispatch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Dispatch" ADD COLUMN     "legalVolunteerStatus" "StatusType" NOT NULL,
ADD COLUMN     "mentalVolunteerStatus" "StatusType" NOT NULL,
ADD COLUMN     "policeVolunteerStatus" "StatusType" NOT NULL;
