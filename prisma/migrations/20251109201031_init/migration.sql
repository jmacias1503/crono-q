-- CreateTable
CREATE TABLE "Students" (
    "student_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "career" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Students_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "Admins" (
    "admin_id" INTEGER NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Admins_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "Queues" (
    "queue_id" SERIAL NOT NULL,
    "current_spot" INTEGER NOT NULL,
    "estimated_wait" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,

    CONSTRAINT "Queues_pkey" PRIMARY KEY ("queue_id")
);

-- CreateTable
CREATE TABLE "Events" (
    "event_id" SERIAL NOT NULL,
    "event_name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "day" TIMESTAMP(3),
    "i_hour" TIMESTAMP(3),
    "f_hour" TIMESTAMP(3),
    "event_code" TEXT,
    "status" BOOLEAN NOT NULL,

    CONSTRAINT "Events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "Turns" (
    "turn_id" SERIAL NOT NULL,
    "queue_id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,

    CONSTRAINT "Turns_pkey" PRIMARY KEY ("turn_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Events_event_code_key" ON "Events"("event_code");

-- AddForeignKey
ALTER TABLE "Queues" ADD CONSTRAINT "Queues_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Events"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turns" ADD CONSTRAINT "Turns_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "Queues"("queue_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turns" ADD CONSTRAINT "Turns_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Events"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turns" ADD CONSTRAINT "Turns_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;
