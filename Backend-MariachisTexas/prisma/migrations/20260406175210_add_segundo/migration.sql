/*
  Warnings:

  - The values [TARJETA] on the enum `MetodoPago` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MetodoPago_new" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA', 'OTRO');
ALTER TABLE "abono" ALTER COLUMN "metodoPago" TYPE "MetodoPago_new" USING ("metodoPago"::text::"MetodoPago_new");
ALTER TABLE "venta" ALTER COLUMN "metodoPago" TYPE "MetodoPago_new" USING ("metodoPago"::text::"MetodoPago_new");
ALTER TYPE "MetodoPago" RENAME TO "MetodoPago_old";
ALTER TYPE "MetodoPago_new" RENAME TO "MetodoPago";
DROP TYPE "public"."MetodoPago_old";
COMMIT;
