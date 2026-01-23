/*
  Warnings:

  - You are about to drop the column `assignee_id` on the `action_item` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "action_item" DROP CONSTRAINT "action_item_assignee_id_fkey";

-- AlterTable
ALTER TABLE "action_item" DROP COLUMN "assignee_id";

-- CreateTable
CREATE TABLE "action_item_assignee" (
    "id" TEXT NOT NULL,
    "action_item_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_item_assignee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "action_item_assignee_action_item_id_user_id_key" ON "action_item_assignee"("action_item_id", "user_id");

-- AddForeignKey
ALTER TABLE "action_item_assignee" ADD CONSTRAINT "action_item_assignee_action_item_id_fkey" FOREIGN KEY ("action_item_id") REFERENCES "action_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_item_assignee" ADD CONSTRAINT "action_item_assignee_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
