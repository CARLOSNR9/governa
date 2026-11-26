-- Control de Gastos: pasa a MAYÚSCULAS los textos ya registrados.
-- translate() garantiza tildes, diéresis y ñ aunque la configuración regional
-- de la base de datos no las convierta con UPPER().
UPDATE "Transaccion"
SET "concepto"  = translate(UPPER("concepto"), 'áéíóúüñàèìòù', 'ÁÉÍÓÚÜÑÀÈÌÒÙ'),
    "categoria" = translate(UPPER("categoria"), 'áéíóúüñàèìòù', 'ÁÉÍÓÚÜÑÀÈÌÒÙ');

UPDATE "Proyecto"
SET "nombre"      = translate(UPPER("nombre"), 'áéíóúüñàèìòù', 'ÁÉÍÓÚÜÑÀÈÌÒÙ'),
    "descripcion" = translate(UPPER("descripcion"), 'áéíóúüñàèìòù', 'ÁÉÍÓÚÜÑÀÈÌÒÙ');
