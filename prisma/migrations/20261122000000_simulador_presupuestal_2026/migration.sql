-- CreateTable
CREATE TABLE "SimConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "victimasRecursos" INTEGER NOT NULL DEFAULT 0,
    "victimasMesa" INTEGER NOT NULL DEFAULT 0,
    "victimasNotas" TEXT,
    "modificadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimGasto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "grupo" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "valorReferencia" INTEGER,
    "descripcion" TEXT,
    "observaciones" TEXT,
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoPor" TEXT,
    "modificadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimGasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimDesglose" (
    "id" TEXT NOT NULL,
    "gastoId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "valor" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SimDesglose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimEscenario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "observaciones" TEXT,
    "bolsaInicial" INTEGER NOT NULL,
    "descuento" INTEGER NOT NULL,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoPor" TEXT,
    "modificadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimEscenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimEscenarioItem" (
    "id" TEXT NOT NULL,
    "escenarioId" TEXT NOT NULL,
    "gastoId" TEXT NOT NULL,
    "incluido" BOOLEAN NOT NULL DEFAULT true,
    "valor" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimEscenarioItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SimEscenarioItem_gastoId_idx" ON "SimEscenarioItem"("gastoId");

-- CreateIndex
CREATE UNIQUE INDEX "SimEscenarioItem_escenarioId_gastoId_key" ON "SimEscenarioItem"("escenarioId", "gastoId");

-- AddForeignKey
ALTER TABLE "SimDesglose" ADD CONSTRAINT "SimDesglose_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "SimGasto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimEscenarioItem" ADD CONSTRAINT "SimEscenarioItem_escenarioId_fkey" FOREIGN KEY ("escenarioId") REFERENCES "SimEscenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimEscenarioItem" ADD CONSTRAINT "SimEscenarioItem_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "SimGasto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

