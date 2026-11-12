CREATE TABLE "wechat_family_member" (
    "id" UUID NOT NULL,
    "openid" VARCHAR(128) NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wechat_family_member_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wechat_family_member_openid_key" ON "wechat_family_member"("openid");

CREATE TABLE "wechat_family_invite" (
    "digest" CHAR(64) NOT NULL,
    "owner_openid" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "wechat_family_invite_pkey" PRIMARY KEY ("digest")
);
