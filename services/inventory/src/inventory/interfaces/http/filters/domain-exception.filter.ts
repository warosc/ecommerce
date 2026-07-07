import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import {
  DomainError,
  InsufficientStockError,
  InvalidMovementError,
  InventoryItemNotFoundError,
} from '../../../domain/errors';

interface HttpResponse {
  status(code: number): { json(body: unknown): void };
}

/** Traduce los errores de dominio de inventario a respuestas HTTP. */
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
    if (exception instanceof InventoryItemNotFoundError) return HttpStatus.NOT_FOUND;
    if (exception instanceof InsufficientStockError) return HttpStatus.CONFLICT;
    if (exception instanceof InvalidMovementError) return HttpStatus.BAD_REQUEST;
    return HttpStatus.UNPROCESSABLE_ENTITY;
  }
}
