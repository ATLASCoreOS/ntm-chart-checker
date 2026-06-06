-- CreateTable
CREATE TABLE "rate_hits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_hits_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "idx_ratehit_expires" ON "rate_hits"("expires_at");
