-- CreateTable
CREATE TABLE "exp" (
    "id" SERIAL NOT NULL,
    "day" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "user_course_id" INTEGER NOT NULL,

    CONSTRAINT "exp_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "exp" ADD CONSTRAINT "exp_user_course_id_fkey" FOREIGN KEY ("user_course_id") REFERENCES "user_course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
