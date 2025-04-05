/*
  Warnings:

  - The `border_crossings` column on the `Segment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `end_time` to the `Segment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `Segment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Segment" ADD COLUMN     "end_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "start_time" TIMESTAMP(3) NOT NULL,
DROP COLUMN "border_crossings",
ADD COLUMN     "border_crossings" TEXT[];
