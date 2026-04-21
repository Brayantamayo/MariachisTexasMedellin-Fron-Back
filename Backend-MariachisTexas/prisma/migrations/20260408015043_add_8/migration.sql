/*
  Warnings:

  - The values [TI] on the enum `TipoDocumento` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "MetodoPago" ADD VALUE 'TARJETA';

-- AlterEnum
BEGIN;
CREATE TYPE "TipoDocumento_new" AS ENUM ('CC', 'CE', 'PAS');
ALTER TABLE "public"."cliente" ALTER COLUMN "tipoDocumento" DROP DEFAULT;
ALTER TABLE "public"."empleado" ALTER COLUMN "tipoDocumento" DROP DEFAULT;
ALTER TABLE "empleado" ALTER COLUMN "tipoDocumento" TYPE "TipoDocumento_new" USING ("tipoDocumento"::text::"TipoDocumento_new");
ALTER TABLE "cliente" ALTER COLUMN "tipoDocumento" TYPE "TipoDocumento_new" USING ("tipoDocumento"::text::"TipoDocumento_new");
ALTER TYPE "TipoDocumento" RENAME TO "TipoDocumento_old";
ALTER TYPE "TipoDocumento_new" RENAME TO "TipoDocumento";
DROP TYPE "public"."TipoDocumento_old";
ALTER TABLE "cliente" ALTER COLUMN "tipoDocumento" SET DEFAULT 'CC';
ALTER TABLE "empleado" ALTER COLUMN "tipoDocumento" SET DEFAULT 'CC';
COMMIT;
