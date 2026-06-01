-- CreateTable
CREATE TABLE "TipoLicencia" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "requiere_saldo" BOOLEAN NOT NULL DEFAULT true,
    "descripcion" TEXT,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TipoLicencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feriado" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "nombre" TEXT NOT NULL,
    "es_recurrente" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Feriado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoLicencia_nombre_key" ON "TipoLicencia"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "TipoLicencia_codigo_key" ON "TipoLicencia"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Feriado_fecha_key" ON "Feriado"("fecha");
