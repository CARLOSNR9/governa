-- AlterTable: clase de proyecto (con presupuesto asignado o gasto acumulado)
ALTER TABLE "Proyecto" ADD COLUMN "tipo" TEXT NOT NULL DEFAULT 'ACUMULADO';

-- Los proyectos existentes con presupuesto asignado quedan como "con presupuesto".
UPDATE "Proyecto" SET "tipo" = 'PRESUPUESTO' WHERE "presupuesto" > 0;
