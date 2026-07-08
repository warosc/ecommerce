# Fase 7 — Agenda + Pacientes (núcleo clínico)

## Alcance
Microservicio clínico con **expediente de pacientes** (graduación + notas) y
**agenda de citas**, con **datos sensibles**: cifrado en reposo, auditoría y RBAC.
Ver [ADR-0014](../../adr/0014-clinica-pacientes-agenda.md).

- **`services/clinic`** (NestJS, BD `optimus_clinic`).
- **Pacientes**: `POST /api/patients`, `GET /api/patients` (contacto),
  `GET /api/patients/:id` (expediente, solo admin), `PUT /api/patients/:id/clinical`.
- **Agenda**: `POST /api/appointments`, `GET /api/appointments`,
  `PATCH /api/appointments/:id/status`.
- **Cifrado en reposo** AES-256-GCM de graduación y notas (`FieldEncryptor`).
- **Auditoría** append-only en `clinic_audit` de accesos/cambios clínicos.

## Componentes / archivos clave
- `services/clinic/src/clinic/domain/**` — Patient, Appointment, graduación (VO).
- `services/clinic/src/clinic/infrastructure/crypto/aes-field-encryptor.ts` — cifrado.
- `services/clinic/src/clinic/infrastructure/audit/prisma-audit-log.ts` — auditoría.
- `services/clinic/src/clinic/infrastructure/persistence/prisma/patient.prisma.repository.ts`
  — cifra/descifra en el borde de persistencia.
- `services/clinic/src/clinic/interfaces/http/*.controller.ts` — RBAC por endpoint.
- `docker-compose.yml` (`clinic-api`), `infra/postgres/init` (`optimus_clinic`),
  `.env` (`CLINIC_ENCRYPTION_KEY`).

## Cómo verificar
1. Crear la BD si el volumen ya existía: `optimus_clinic` (el init solo corre en
   volumen nuevo). Luego `docker compose up -d --build`.
2. Token de `admin` (Keycloak). Crear paciente con graduación:
   ```bash
   curl -X POST http://localhost:3007/api/patients -H "Authorization: Bearer $TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{"firstName":"Ana","lastName":"García","prescription":{"od":{"sphere":-1.25,"axis":90},"pd":63},"notes":"Miopía"}'
   ```
3. **Comprobar cifrado en reposo**: en la BD, `prescriptionCipher`/`notesCipher`
   son texto cifrado (`v1.…`), nunca la graduación en claro.
4. `GET /api/patients/:id` (admin) devuelve la graduación **descifrada** y deja una
   entrada `PATIENT_VIEWED` en `clinic_audit`.
5. Agenda: crear cita para el paciente y cambiar su estado.

## Criterios de aceptación
- [ ] Alta/consulta/edición de pacientes y agenda funcionan (201/200) con validación.
- [ ] La graduación y notas se guardan **cifradas** (nada en claro en la BD) y se
      devuelven descifradas al leer el expediente.
- [ ] Cada acceso/cambio clínico deja traza en `clinic_audit`.
- [ ] RBAC: sin token → 401; el expediente completo exige rol `admin`.
- [ ] Tests clínicos en verde (unit+e2e, cobertura ≥90%).

## Notas
- Gestión de claves por env en dev; en prod, gestor de secretos + rotación
  (el prefijo `v1.` permite versionar el cifrado). Datos en tránsito: TLS en prod.
- UI de Admin para pacientes/agenda: pendiente (esta fase entrega el servicio y su
  API verificada; la pantalla se añade después).
