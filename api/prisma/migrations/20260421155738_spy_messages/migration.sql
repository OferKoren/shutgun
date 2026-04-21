-- CreateTable
CREATE TABLE "SpyMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpyMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpyMessage_createdAt_idx" ON "SpyMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "SpyMessage" ADD CONSTRAINT "SpyMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
