-- CreateTable
CREATE TABLE "SaldoLicencia" (
    "id" SERIAL NOT NULL,
    "empleado_id" INTEGER NOT NULL,
    "tipo_licencia_id" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "total_dias" DOUBLE PRECISION NOT NULL,
    "dias_usados" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dias_ajustados" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "SaldoLicencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SaldoLicencia_empleado_id_tipo_licencia_id_anio_key" ON "SaldoLicencia"("empleado_id", "tipo_licencia_id", "anio");

-- AddForeignKey
ALTER TABLE "SaldoLicencia" ADD CONSTRAINT "SaldoLicencia_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoLicencia" ADD CONSTRAINT "SaldoLicencia_tipo_licencia_id_fkey" FOREIGN KEY ("tipo_licencia_id") REFERENCES "TipoLicencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
