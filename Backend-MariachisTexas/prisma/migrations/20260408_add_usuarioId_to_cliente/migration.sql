-- AlterTable - Primero eliminamos la FK antigua con email
ALTER TABLE "cliente" DROP CONSTRAINT "cliente_email_fkey";

-- AlterTable - Agregamos columna usuarioId
ALTER TABLE "cliente" ADD COLUMN "usuarioId" INTEGER;

-- PopulateData - Relacionar clientes existentes con usuarios por email
UPDATE "cliente" 
SET "usuarioId" = u.id
FROM "usuario" u
WHERE "cliente"."email" = u.email;

-- AlterTable - Hacer usuarioId NOT NULL y UNIQUE
ALTER TABLE "cliente" ALTER COLUMN "usuarioId" SET NOT NULL;
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_usuarioId_key" UNIQUE ("usuarioId");

-- AddForeignKey - Nueva relación con onDelete Cascade
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
