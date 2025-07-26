/*
  Warnings:

  - You are about to drop the column `parentContentId` on the `Course` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_parentContentId_fkey";

-- DropIndex
DROP INDEX "Course_parentContentId_idx";

-- DropIndex
DROP INDEX "Course_parentContentId_key";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "parentContentId";
