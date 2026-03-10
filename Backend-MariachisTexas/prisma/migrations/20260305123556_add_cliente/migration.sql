-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('CEDULA', 'PASAPORTE', 'CEDULA_EXTRANJERIA');

-- CreateEnum
CREATE TYPE "ZonaServicio" AS ENUM ('URBANA', 'RURAL');

-- CreateTable
CREATE TABLE "cliente" (
    "id" SERIAL NOT NULL,
    "foto" TEXT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL DEFAULT 'CEDULA',
    "numeroDocumento" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "telefonoPrincipal" TEXT NOT NULL,
    "telefonoAlternativo" TEXT,
    "ciudad" TEXT NOT NULL DEFAULT 'Medellín',
    "barrio" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "zonaServicio" "ZonaServicio" NOT NULL DEFAULT 'URBANA',
    "password" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cliente_numeroDocumento_key" ON "cliente"("numeroDocumento");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_email_key" ON "cliente"("email");
