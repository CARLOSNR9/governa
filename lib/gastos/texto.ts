/** Convierte el texto a MAYÚSCULAS (incluye tildes y ñ), sin importar cómo esté el teclado. */
export function aMayusculas(texto: string): string {
    return (texto ?? "").toLocaleUpperCase("es-CO");
}
