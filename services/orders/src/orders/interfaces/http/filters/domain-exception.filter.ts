import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import {
  DomainError,
  EmptyCartError,
  InsufficientStockError,
  InvalidOrderError,
  OrderNotFoundError,
  ProductNotAvailableError,
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
    if (exception instanceof OrderNotFoundError) return HttpStatus.NOT_FOUND;
    if (exception instanceof ProductNotAvailableError) return HttpStatus.NOT_FOUND;
    if (exception instanceof InsufficientStockError) return HttpStatus.CONFLICT;
    if (exception instanceof EmptyCartError) return HttpStatus.BAD_REQUEST;
    if (exception instanceof InvalidOrderError) return HttpStatus.BAD_REQUEST;
    return HttpStatus.UNPROCESSABLE_ENTITY;
  }
}
