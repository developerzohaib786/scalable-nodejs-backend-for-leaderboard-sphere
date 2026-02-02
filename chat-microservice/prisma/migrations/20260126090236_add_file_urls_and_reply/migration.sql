-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "rawFileUrl" TEXT,
ADD COLUMN     "replyToId" TEXT,
ADD COLUMN     "replyToText" TEXT,
ADD COLUMN     "videoUrl" TEXT;
