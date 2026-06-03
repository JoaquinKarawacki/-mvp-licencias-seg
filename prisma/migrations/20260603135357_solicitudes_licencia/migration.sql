-- CreateTable
CREATE TABLE "SolicitudLicencia" (
    "id" SERIAL NOT NULL,
    "empleado_id" INTEGER NOT NULL,
    "tipo_licencia_id" INTEGER NOT NULL,
    "dias_descontados" INTEGER NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE',
    "comentario" TEXT,
    "revisado_por" INTEGER,
    "motivo_rechazo" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitudLicencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaSolicitado" (
    "id" SERIAL NOT NULL,
    "solicitud_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiaSolicitado_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SolicitudLicencia" ADD CONSTRAINT "SolicitudLicencia_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudLicencia" ADD CONSTRAINT "SolicitudLicencia_revisado_por_fkey" FOREIGN KEY ("revisado_por") REFERENCES "Empleado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudLicencia" ADD CONSTRAINT "SolicitudLicencia_tipo_licencia_id_fkey" FOREIGN KEY ("tipo_licencia_id") REFERENCES "TipoLicencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaSolicitado" ADD CONSTRAINT "DiaSolicitado_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "SolicitudLicencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
