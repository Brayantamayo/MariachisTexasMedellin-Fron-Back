/*
  Warnings:

  - You are about to drop the column `usuarioId` on the `rol_permiso` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rolId,permisoId]` on the table `rol_permiso` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rolPermisoId` to the `usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "rol_permiso" DROP CONSTRAINT "rol_permiso_usuarioId_fkey";

-- DropIndex
DROP INDEX "rol_permiso_usuarioId_rolId_permisoId_key";

-- AlterTable
ALTER TABLE "rol_permiso" DROP COLUMN "usuarioId";

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "rolPermisoId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "rol_permiso_rolId_permisoId_key" ON "rol_permiso"("rolId", "permisoId");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_rolPermisoId_fkey" FOREIGN KEY ("rolPermisoId") REFERENCES "rol_permiso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
