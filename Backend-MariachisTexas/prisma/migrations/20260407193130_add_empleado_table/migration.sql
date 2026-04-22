-- CreateTable
CREATE TABLE "empleado" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL DEFAULT 'CC',
    "numeroDocumento" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "telefonoPrincipal" TEXT NOT NULL,
    "telefonoAlternativo" TEXT,
    "ciudad" TEXT NOT NULL DEFAULT 'Medellín',
    "barrio" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "zonaServicio" "ZonaServicio" NOT NULL DEFAULT 'URBANA',
    "instrumentoPrincipal" TEXT NOT NULL,
    "otrosInstrumentos" TEXT,
    "anosExperiencia" INTEGER NOT NULL DEFAULT 0,
    "foto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empleado_usuarioId_key" ON "empleado"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "empleado_numeroDocumento_key" ON "empleado"("numeroDocumento");

-- AddForeignKey
ALTER TABLE "empleado" ADD CONSTRAINT "empleado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
