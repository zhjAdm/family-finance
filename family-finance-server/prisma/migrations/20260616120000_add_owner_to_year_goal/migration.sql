-- Drop existing year goals (no owner assigned)
DELETE FROM "finance_year_goal";

-- DropIndex
DROP INDEX "finance_year_goal_year_key";

-- AlterTable
ALTER TABLE "finance_year_goal" ADD COLUMN "owner_id" BIGINT NOT NULL DEFAULT 0;

-- Remove default after adding column
ALTER TABLE "finance_year_goal" ALTER COLUMN "owner_id" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "finance_year_goal" ADD CONSTRAINT "finance_year_goal_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "finance_owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "finance_year_goal_year_owner_id_key" ON "finance_year_goal"("year", "owner_id");
