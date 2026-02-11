-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_folios" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "charts" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chart_folios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_year" INTEGER NOT NULL,
    "week_number" INTEGER NOT NULL,
    "charts" INTEGER[],
    "results" JSONB NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "chart_folios_user_id_key" ON "chart_folios"("user_id");

-- CreateIndex
CREATE INDEX "idx_checks_user_date" ON "checks"("user_id", "checked_at" DESC);

-- CreateIndex
CREATE INDEX "idx_checks_user_week" ON "checks"("user_id", "week_year", "week_number");

-- AddForeignKey
ALTER TABLE "chart_folios" ADD CONSTRAINT "chart_folios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checks" ADD CONSTRAINT "checks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
