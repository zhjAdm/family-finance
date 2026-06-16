-- CreateTable
CREATE TABLE "finance_year_goal" (
    "id" BIGSERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "target_amount" DECIMAL(18,2) NOT NULL,
    "start_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "remark" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_year_goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_owner" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(50),
    "remark" VARCHAR(255),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_asset_type" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "direction" VARCHAR(20) NOT NULL DEFAULT 'ASSET',
    "risk_level" VARCHAR(20) DEFAULT 'NONE',
    "include_in_total" BOOLEAN NOT NULL DEFAULT true,
    "include_in_chart" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "remark" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_asset_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_account" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100),
    "owner_id" BIGINT NOT NULL,
    "default_asset_type_id" BIGINT,
    "account_category" VARCHAR(50),
    "include_in_total" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "remark" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_asset_snapshot" (
    "id" BIGSERIAL NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "account_id" BIGINT NOT NULL,
    "asset_type_id" BIGINT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "calculated_amount" DECIMAL(18,2) NOT NULL,
    "remark" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_asset_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finance_year_goal_year_key" ON "finance_year_goal"("year");

-- CreateIndex
CREATE UNIQUE INDEX "finance_asset_type_code_key" ON "finance_asset_type"("code");

-- CreateIndex
CREATE UNIQUE INDEX "finance_account_code_key" ON "finance_account"("code");

-- AddForeignKey
ALTER TABLE "finance_account" ADD CONSTRAINT "finance_account_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "finance_owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_account" ADD CONSTRAINT "finance_account_default_asset_type_id_fkey" FOREIGN KEY ("default_asset_type_id") REFERENCES "finance_asset_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_asset_snapshot" ADD CONSTRAINT "finance_asset_snapshot_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "finance_owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_asset_snapshot" ADD CONSTRAINT "finance_asset_snapshot_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "finance_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_asset_snapshot" ADD CONSTRAINT "finance_asset_snapshot_asset_type_id_fkey" FOREIGN KEY ("asset_type_id") REFERENCES "finance_asset_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
