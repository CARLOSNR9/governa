-- CreateTable
CREATE TABLE "PresupuestoCierre" (
    "id" TEXT NOT NULL DEFAULT 'cierre-2026',
    "datos" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "modificadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresupuestoCierre_pkey" PRIMARY KEY ("id")
);

