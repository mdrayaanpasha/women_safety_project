-- CreateEnum
CREATE TYPE "UserTypes" AS ENUM ('LEGAL', 'POLICE', 'MENTAL');

-- CreateEnum
CREATE TYPE "ComplaintTypes" AS ENUM ('PHYSICAL', 'EMOTIONAL', 'SEXUAL', 'FINANCIAL', 'CYBER', 'DOWRY', 'OTHER');

-- CreateEnum
CREATE TYPE "StatusType" AS ENUM ('QUEUED', 'AUTO_DISPATCHED', 'VOLUNTEER_ARRIVED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "type" "UserTypes" NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaints" (
    "id" SERIAL NOT NULL,
    "phoneNo" TEXT NOT NULL,
    "name" TEXT,
    "type" "ComplaintTypes" NOT NULL,
    "status" "StatusType" NOT NULL DEFAULT 'QUEUED',
    "description" TEXT,
    "location" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispatch" (
    "id" SERIAL NOT NULL,
    "legalVolunteerId" INTEGER,
    "mentalVolunteerId" INTEGER,
    "policeVolunteerId" INTEGER,
    "complaintId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_legalVolunteerId_fkey" FOREIGN KEY ("legalVolunteerId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_mentalVolunteerId_fkey" FOREIGN KEY ("mentalVolunteerId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_policeVolunteerId_fkey" FOREIGN KEY ("policeVolunteerId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
