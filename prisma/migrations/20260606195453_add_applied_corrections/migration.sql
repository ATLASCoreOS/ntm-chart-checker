-- CreateTable
CREATE TABLE "applied_corrections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "chart" INTEGER NOT NULL,
    "nm_number" TEXT NOT NULL,
    "week_year" INTEGER NOT NULL,
    "week_number" INTEGER NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applied_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_applied_user" ON "applied_corrections"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_applied" ON "applied_corrections"("user_id", "week_year", "week_number", "chart", "nm_number");

-- AddForeignKey
ALTER TABLE "applied_corrections" ADD CONSTRAINT "applied_corrections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
