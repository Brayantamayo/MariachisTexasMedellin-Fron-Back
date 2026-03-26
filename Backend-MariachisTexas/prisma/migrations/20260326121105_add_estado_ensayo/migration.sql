-- CreateEnum
CREATE TYPE "EstadoEnsayo" AS ENUM ('PENDIENTE', 'LISTO');

-- AlterTable
ALTER TABLE "ensayo" ADD COLUMN     "estado" "EstadoEnsayo" NOT NULL DEFAULT 'PENDIENTE';
