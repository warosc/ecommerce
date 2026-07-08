import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import {
  AppointmentNotFoundError,
  DomainError,
  InvalidAppointmentError,
  InvalidPatientError,
  PatientNotFoundError,
} from '../../../domain/errors';

interface HttpResponse {
  status(code: number): { json(body: unknown): void };
}

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    const status = this.statusFor(exception);
    response.status(status).json({
      statusCode: status,
      error: exception.code,
      message: exception.message,
    });
  }

  private statusFor(exception: DomainError): number {
    if (exception instanceof PatientNotFoundError) return HttpStatus.NOT_FOUND;
    if (exception instanceof AppointmentNotFoundError) return HttpStatus.NOT_FOUND;
    if (exception instanceof InvalidPatientError) return HttpStatus.BAD_REQUEST;
    if (exception instanceof InvalidAppointmentError) return HttpStatus.BAD_REQUEST;
    return HttpStatus.UNPROCESSABLE_ENTITY;
  }
}
