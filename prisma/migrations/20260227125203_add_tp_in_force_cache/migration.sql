-- CreateTable
CREATE TABLE "tp_in_force_cache" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "week_year" INTEGER NOT NULL,
    "week_number" INTEGER NOT NULL,
    "section_text" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tp_in_force_cache_pkey" PRIMARY KEY ("id")
);
