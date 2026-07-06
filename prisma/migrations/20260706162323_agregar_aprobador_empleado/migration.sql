-- AlterTable
ALTER TABLE "Empleado" ADD COLUMN     "aprobador_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_aprobador_id_fkey" FOREIGN KEY ("aprobador_id") REFERENCES "Empleado"("id") ON DELETE SET NULL ON UPDATE CASCADE;
