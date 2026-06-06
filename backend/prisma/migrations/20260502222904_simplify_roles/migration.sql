/*
  Warnings:

  - The values [MEMBER] on the enum `OrgRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [VIEWER] on the enum `ProjectRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `role` on the `OrgInvite` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;

ALTER TABLE "OrgInvite" DROP COLUMN IF EXISTS role;
DROP TYPE IF EXISTS "OrgRole_old" CASCADE;
DROP TYPE IF EXISTS "ProjectRole_old" CASCADE;
CREATE TYPE "OrgRole_new" AS ENUM ('OWNER', 'ADMIN');
ALTER TABLE "public"."OrgMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "OrgMember" ALTER COLUMN "role" TYPE "OrgRole_new" USING ("role"::text::"OrgRole_new");
ALTER TYPE "OrgRole" RENAME TO "OrgRole_old";
ALTER TYPE "OrgRole_new" RENAME TO "OrgRole";
DROP TYPE "public"."OrgRole_old";
ALTER TABLE "OrgMember" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProjectRole_new" AS ENUM ('MANAGER', 'DEVELOPER');
ALTER TABLE "public"."ProjectMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "ProjectMember" ALTER COLUMN "role" TYPE "ProjectRole_new" USING ("role"::text::"ProjectRole_new");
ALTER TYPE "ProjectRole" RENAME TO "ProjectRole_old";
ALTER TYPE "ProjectRole_new" RENAME TO "ProjectRole";
DROP TYPE "public"."ProjectRole_old";
ALTER TABLE "ProjectMember" ALTER COLUMN "role" SET DEFAULT 'DEVELOPER';
COMMIT;

-- AlterTable
ALTER TABLE "OrgInvite" DROP COLUMN IF EXISTS "role";

-- AlterTable
ALTER TABLE "OrgMember" ALTER COLUMN "role" SET DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "ProjectMember" ALTER COLUMN "role" SET DEFAULT 'DEVELOPER';
