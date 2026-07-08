# ADR-0014: Servicio Clínico (Pacientes + Agenda) con cifrado en reposo, auditoría y RBAC

- **Estado:** Aceptado
- **Fase:** 7

## Contexto
Una óptica gestiona **expedientes de pacientes** (graduación, notas clínicas) y una
**agenda de citas**. Son **datos sensibles** (salud): requieren cifrado en reposo,
trazabilidad de accesos y control de acceso por rol.

## Decisión
Nuevo microservicio **`services/clinic`** (NestJS, Clean Architecture, BD propia
`optimus_clinic`) con dos agregados: **Patient** (expediente) y **Appointment**
(cita).

- **Cifrado en reposo a nivel de aplicación**: la graduación (JSON) y las notas se
  cifran con **AES-256-GCM** (autenticado) antes de persistir. En la BD solo hay
  texto cifrado (`v1.<base64(iv|tag|ct)>`). Se abstrae tras el puerto
  **`FieldEncryptor`**; el adaptador lee la clave de `CLINIC_ENCRYPTION_KEY`. El
  dominio siempre maneja datos en claro; el cifrado vive en el adaptador de
  persistencia.
- **Auditoría append-only**: cada creación/lectura/cambio de datos clínicos se
  registra en `clinic_audit` (actor, acción, entidad) vía el puerto **`AuditLog`**.
- **RBAC** (roles de Keycloak):
  - Alta y listado de pacientes (contacto): `admin` o `vendedor` (recepción).
  - **Lectura del expediente completo y edición clínica**: solo `admin` (rol
    clínico). El listado no expone graduación ni notas.
  - Agenda (crear/listar/cambiar estado de citas): `admin` o `vendedor`.
- **Sin eventos** (MVP autocontenido); se integrará con el resto por eventos cuando
  haga falta (p. ej. recordatorios de cita).

## Alternativas consideradas
- **Cifrado a nivel de BD (TDE)**: no disponible en Postgres estándar del MVP;
  además el cifrado de aplicación protege también ante acceso directo a la BD.
- **No cifrar**: inaceptable para datos de salud.
- **Meter pacientes en un servicio existente**: rompe el contexto acotado; el
  expediente clínico es su propio dominio.

## Consecuencias
- **Gestión de claves**: la clave va por env en dev; en prod, gestor de secretos y
  **rotación** (pendiente: reencriptado por versión de clave — el prefijo `v1.` ya
  deja sitio para versionar).
- **Datos en tránsito**: requieren TLS en producción (pendiente, como el resto).
- Trazabilidad completa de accesos a datos clínicos en `clinic_audit`.
- RBAC fina real (roles `optometrista`/`recepcionista`) queda como evolución;
  ahora se reutilizan `admin`/`vendedor`.
