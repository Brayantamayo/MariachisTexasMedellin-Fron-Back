/*
  Warnings:

  - You are about to drop the column `rolPermisoId` on the `usuario` table. All the data in the column will be lost.
  - Added the required column `rolId` to the `usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "usuario" DROP CONSTRAINT "usuario_rolPermisoId_fkey";

-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "rolPermisoId",
ADD COLUMN     "rolId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
