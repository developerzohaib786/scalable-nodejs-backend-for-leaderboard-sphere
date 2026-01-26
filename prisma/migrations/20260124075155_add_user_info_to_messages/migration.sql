-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "userImage" TEXT NOT NULL DEFAULT 'https://avatar.iran.liara.run/public/1',
ADD COLUMN     "userName" TEXT NOT NULL DEFAULT 'Anonymous';
