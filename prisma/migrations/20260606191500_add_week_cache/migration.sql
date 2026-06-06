-- CreateTable
CREATE TABLE "week_cache" (
    "id" TEXT NOT NULL,
    "week_year" INTEGER NOT NULL,
    "week_number" INTEGER NOT NULL,
    "snii_text" TEXT NOT NULL,
    "page_texts" JSONB NOT NULL,
    "section_ia_text" TEXT NOT NULL,
    "links" JSONB NOT NULL,
    "week_info" JSONB NOT NULL,
    "has_in_force" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "week_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uniq_weekcache_year_week" ON "week_cache"("week_year", "week_number");
