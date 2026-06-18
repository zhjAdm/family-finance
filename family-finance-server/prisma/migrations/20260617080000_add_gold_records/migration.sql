-- CreateTable
CREATE TABLE "finance_gold" (
    "id" BIGSERIAL NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "purchase_date" DATE NOT NULL,
    "channel" VARCHAR(100) NOT NULL,
    "weight_grams" DECIMAL(10,4) NOT NULL,
    "purchase_amount" DECIMAL(18,2) NOT NULL,
    "price_per_gram" DECIMAL(10,2) NOT NULL,
    "remark" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_gold_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "finance_gold" ADD CONSTRAINT "finance_gold_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "finance_owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
