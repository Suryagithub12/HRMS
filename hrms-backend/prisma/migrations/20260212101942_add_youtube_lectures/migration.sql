-- CreateTable
CREATE TABLE "freelance_faculty_youtube_lectures" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "freelance_faculty_youtube_lectures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "freelance_faculty_youtube_lectures_facultyId_date_idx" ON "freelance_faculty_youtube_lectures"("facultyId", "date");

-- AddForeignKey
ALTER TABLE "freelance_faculty_youtube_lectures" ADD CONSTRAINT "freelance_faculty_youtube_lectures_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "freelance_faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
