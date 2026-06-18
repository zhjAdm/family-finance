-- DropForeignKey
ALTER TABLE "finance_gold" DROP CONSTRAINT "finance_gold_owner_id_fkey";

-- AlterTable
ALTER TABLE "finance_gold" DROP COLUMN "owner_id";
