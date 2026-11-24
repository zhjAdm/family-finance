-- Members now request access on first login and wait for the manager's approval.
ALTER TABLE "wechat_family_member" ADD COLUMN "approved_at" TIMESTAMP(3);

-- Everyone who already joined keeps access.
UPDATE "wechat_family_member" SET "approved_at" = "joined_at";

DROP TABLE "wechat_family_invite";
