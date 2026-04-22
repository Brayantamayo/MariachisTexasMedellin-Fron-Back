-- DropForeignKey
ALTER TABLE "cotizacion_repertorio" DROP CONSTRAINT "cotizacion_repertorio_repertorioId_fkey";

-- DropForeignKey
ALTER TABLE "ensayo_repertorio" DROP CONSTRAINT "ensayo_repertorio_repertorioId_fkey";

-- AddForeignKey
ALTER TABLE "cotizacion_repertorio" ADD CONSTRAINT "cotizacion_repertorio_repertorioId_fkey" FOREIGN KEY ("repertorioId") REFERENCES "repertorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ensayo_repertorio" ADD CONSTRAINT "ensayo_repertorio_repertorioId_fkey" FOREIGN KEY ("repertorioId") REFERENCES "repertorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
