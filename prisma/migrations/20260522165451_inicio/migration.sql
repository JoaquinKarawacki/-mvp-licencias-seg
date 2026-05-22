-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('EMPLEADO', 'ADMIN');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "hash_contrasena" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'EMPLEADO',
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empleado" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL,
    "es_encargado" BOOLEAN NOT NULL DEFAULT false,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,
    "sector_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sector_nombre_key" ON "Sector"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_usuario_id_key" ON "Empleado"("usuario_id");

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
