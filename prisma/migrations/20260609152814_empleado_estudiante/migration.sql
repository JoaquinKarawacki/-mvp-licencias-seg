-- AlterTable
ALTER TABLE "Empleado" ADD COLUMN     "es_estudiante" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "horas_semanales" INTEGER NOT NULL DEFAULT 0;
