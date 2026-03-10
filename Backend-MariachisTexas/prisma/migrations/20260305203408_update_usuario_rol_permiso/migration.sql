/*
  Warnings:

  - You are about to drop the column `rolId` on the `usuario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[usuarioId,rolId,permisoId]` on the table `rol_permiso` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `usuarioId` to the `rol_permiso` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "usuario" DROP CONSTRAINT "usuario_rolId_fkey";

-- DropIndex
DROP INDEX "rol_permiso_rolId_permisoId_key";

-- AlterTable
ALTER TABLE "rol_permiso" ADD COLUMN     "usuarioId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "rolId";

-- CreateIndex
CREATE UNIQUE INDEX "rol_permiso_usuarioId_rolId_permisoId_key" ON "rol_permiso"("usuarioId", "rolId", "permisoId");

-- AddForeignKey
ALTER TABLE "rol_permiso" ADD CONSTRAINT "rol_permiso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
