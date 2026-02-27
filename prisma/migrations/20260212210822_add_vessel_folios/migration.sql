-- DropIndex
DROP INDEX "chart_folios_user_id_key";

-- AlterTable
ALTER TABLE "chart_folios" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "vessel_name" TEXT NOT NULL DEFAULT 'My Vessel';

-- AlterTable
ALTER TABLE "checks" ADD COLUMN     "folio_id" TEXT,
ADD COLUMN     "vessel_name" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "active_folio_id" TEXT;

-- CreateIndex
CREATE INDEX "idx_folios_user" ON "chart_folios"("user_id");

-- Backfill: set active_folio_id on existing users to their existing folio
UPDATE "users" u
SET "active_folio_id" = cf."id"
FROM "chart_folios" cf
WHERE cf."user_id" = u."id";

-- Backfill: link existing checks to the user's folio
UPDATE "checks" c
SET "folio_id" = cf."id",
    "vessel_name" = cf."vessel_name"
FROM "chart_folios" cf
WHERE cf."user_id" = c."user_id";

-- AddForeignKey
ALTER TABLE "checks" ADD CONSTRAINT "checks_folio_id_fkey" FOREIGN KEY ("folio_id") REFERENCES "chart_folios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
