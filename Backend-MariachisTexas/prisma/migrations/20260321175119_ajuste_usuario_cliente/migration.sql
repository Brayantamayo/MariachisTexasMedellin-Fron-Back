/*
  Warnings:

  - The values [CEDULA,PASAPORTE,CEDULA_EXTRANJERIA] on the enum `TipoDocumento` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `nombre` on the `cliente` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `cliente` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoDocumento_new" AS ENUM ('CC', 'CE', 'PAS');
ALTER TABLE "public"."cliente" ALTER COLUMN "tipoDocumento" DROP DEFAULT;
ALTER TABLE "cliente" ALTER COLUMN "tipoDocumento" TYPE "TipoDocumento_new" USING ("tipoDocumento"::text::"TipoDocumento_new");
ALTER TYPE "TipoDocumento" RENAME TO "TipoDocumento_old";
ALTER TYPE "TipoDocumento_new" RENAME TO "TipoDocumento";
DROP TYPE "public"."TipoDocumento_old";
ALTER TABLE "cliente" ALTER COLUMN "tipoDocumento" SET DEFAULT 'CC';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoEvento" ADD VALUE 'AMOR';
ALTER TYPE "TipoEvento" ADD VALUE 'ANIVERSARIO';
ALTER TYPE "TipoEvento" ADD VALUE 'PADRES';
ALTER TYPE "TipoEvento" ADD VALUE 'FIESTA';

-- AlterTable
ALTER TABLE "cliente" DROP COLUMN "nombre",
DROP COLUMN "password",
ALTER COLUMN "tipoDocumento" SET DEFAULT 'CC';
