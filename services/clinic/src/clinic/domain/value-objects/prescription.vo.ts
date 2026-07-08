import { InvalidPatientError } from '../errors';

/** Graduación de un ojo (dioptrías). */
export interface EyeRx {
  sphere?: number;
  cylinder?: number;
  axis?: number;
  add?: number;
}

/** Graduación óptica: `od` ojo derecho, `os` ojo izquierdo, `pd` distancia interpupilar. */
export interface PrescriptionData {
  od?: EyeRx;
  os?: EyeRx;
  pd?: number;
}

function checkEye(eye: EyeRx | undefined, label: string): void {
  if (!eye) return;
  for (const [k, v] of Object.entries(eye)) {
    if (v !== undefined && !Number.isFinite(v)) {
      throw new InvalidPatientError(`Graduación inválida en ${label} (${k}).`);
    }
  }
  if (eye.axis !== undefined && (eye.axis < 0 || eye.axis > 180)) {
    throw new InvalidPatientError(`El eje de ${label} debe estar entre 0 y 180.`);
  }
}

/** Valida una graduación; lanza InvalidPatientError si algo es incoherente. */
export function validatePrescription(rx: PrescriptionData): void {
  checkEye(rx.od, 'OD');
  checkEye(rx.os, 'OS');
  if (rx.pd !== undefined && (!Number.isFinite(rx.pd) || rx.pd <= 0 || rx.pd > 90)) {
    throw new InvalidPatientError('La distancia interpupilar (DIP) es inválida.');
  }
}
