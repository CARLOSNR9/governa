#!/usr/bin/env bash
# Neon suele "suspender" el cómputo cuando lleva un rato sin uso (scale to zero).
# La primera conexión de un build puede tardar en despertarlo y superar el
# tiempo que Prisma espera para tomar el advisory lock de la migración
# (10s), aunque la base de datos sí responde. Reintentamos unas cuantas
# veces con una pequeña espera para darle tiempo a "despertar".
set -e

ATTEMPTS=4
DELAY=8

for i in $(seq 1 "$ATTEMPTS"); do
  if npx prisma migrate deploy; then
    exit 0
  fi

  if [ "$i" -lt "$ATTEMPTS" ]; then
    echo "prisma migrate deploy falló (intento $i/$ATTEMPTS), reintentando en ${DELAY}s..."
    sleep "$DELAY"
  fi
done

echo "prisma migrate deploy falló después de $ATTEMPTS intentos"
exit 1
