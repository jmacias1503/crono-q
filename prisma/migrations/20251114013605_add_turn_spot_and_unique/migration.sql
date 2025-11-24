/*
  Warnings:

  - A unique constraint covering the columns `[event_id,student_id]` on the table `Turns` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Queues" ADD COLUMN     "last_assigned_spot" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Turns" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "spot_number" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Turns_event_id_student_id_key" ON "Turns"("event_id", "student_id");
