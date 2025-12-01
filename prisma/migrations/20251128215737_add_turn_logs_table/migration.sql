-- CreateTable
CREATE TABLE "TurnLogs" (
    "log_id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "career" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "event_id" INTEGER NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TurnLogs_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE INDEX "TurnLogs_event_id_idx" ON "TurnLogs"("event_id");

-- CreateIndex
CREATE INDEX "TurnLogs_student_id_idx" ON "TurnLogs"("student_id");
