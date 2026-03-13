/*
  Warnings:

  - You are about to drop the `PasswordResetOtp` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoCotizacion" AS ENUM ('EN_ESPERA', 'CONVERTIDA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('CONFIRMADO', 'FINALIZADO', 'VENTA_DIRECTA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoVenta" AS ENUM ('RESERVA', 'DIRECTA');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('BODA', 'CUMPLEANOS', 'QUINCEANIOS', 'FUNERAL', 'RECONCILIACION', 'DIA_DE_MADRE', 'OTRO');

-- DropTable
DROP TABLE "PasswordResetOtp";

-- CreateTable
CREATE TABLE "repertorio" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "artista" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "letra" TEXT,
    "audioUrl" TEXT,
    "duracion" TEXT NOT NULL,
    "dificultad" TEXT NOT NULL,
    "portada" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repertorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizacion" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER,
    "nombreHomenajeado" TEXT NOT NULL,
    "tipoEvento" "TipoEvento" NOT NULL,
    "fechaEvento" TIMESTAMP(3) NOT NULL,
    "horaInicio" TIMESTAMP(3) NOT NULL,
    "horaFin" TIMESTAMP(3) NOT NULL,
    "direccionEvento" TEXT NOT NULL,
    "notasAdicionales" TEXT,
    "totalEstimado" DECIMAL(10,2),
    "esReservaDirecta" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoCotizacion" NOT NULL DEFAULT 'EN_ESPERA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizacion_servicio" (
    "id" SERIAL NOT NULL,
    "cotizacionId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "cotizacion_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizacion_repertorio" (
    "id" SERIAL NOT NULL,
    "cotizacionId" INTEGER NOT NULL,
    "repertorioId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cotizacion_repertorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva" (
    "id" SERIAL NOT NULL,
    "cotizacionId" INTEGER NOT NULL,
    "totalValor" DECIMAL(10,2) NOT NULL,
    "saldoPendiente" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abono" (
    "id" SERIAL NOT NULL,
    "reservaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL,
    "notas" TEXT,
    "nuevoSaldo" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abono_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta" (
    "id" SERIAL NOT NULL,
    "reservaId" INTEGER,
    "clienteId" INTEGER NOT NULL,
    "tipo" "TipoVenta" NOT NULL,
    "estado" "EstadoVenta" NOT NULL,
    "montoTotal" DECIMAL(10,2) NOT NULL,
    "montoPagado" DECIMAL(10,2) NOT NULL,
    "fechaVenta" TIMESTAMP(3) NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ensayo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT NOT NULL,
    "ubicacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ensayo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ensayo_repertorio" (
    "id" SERIAL NOT NULL,
    "ensayoId" INTEGER NOT NULL,
    "repertorioId" INTEGER NOT NULL,

    CONSTRAINT "ensayo_repertorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueo_calendario" (
    "id" SERIAL NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueo_calendario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_otp" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cotizacion_servicio_cotizacionId_servicioId_key" ON "cotizacion_servicio"("cotizacionId", "servicioId");

-- CreateIndex
CREATE UNIQUE INDEX "cotizacion_repertorio_cotizacionId_repertorioId_key" ON "cotizacion_repertorio"("cotizacionId", "repertorioId");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_cotizacionId_key" ON "reserva"("cotizacionId");

-- CreateIndex
CREATE UNIQUE INDEX "venta_reservaId_key" ON "venta"("reservaId");

-- CreateIndex
CREATE UNIQUE INDEX "ensayo_repertorio_ensayoId_repertorioId_key" ON "ensayo_repertorio"("ensayoId", "repertorioId");

-- AddForeignKey
ALTER TABLE "cotizacion" ADD CONSTRAINT "cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizacion_servicio" ADD CONSTRAINT "cotizacion_servicio_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizacion_servicio" ADD CONSTRAINT "cotizacion_servicio_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizacion_repertorio" ADD CONSTRAINT "cotizacion_repertorio_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizacion_repertorio" ADD CONSTRAINT "cotizacion_repertorio_repertorioId_fkey" FOREIGN KEY ("repertorioId") REFERENCES "repertorio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "cotizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abono" ADD CONSTRAINT "abono_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abono" ADD CONSTRAINT "abono_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "venta_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reserva"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ensayo_repertorio" ADD CONSTRAINT "ensayo_repertorio_ensayoId_fkey" FOREIGN KEY ("ensayoId") REFERENCES "ensayo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ensayo_repertorio" ADD CONSTRAINT "ensayo_repertorio_repertorioId_fkey" FOREIGN KEY ("repertorioId") REFERENCES "repertorio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
