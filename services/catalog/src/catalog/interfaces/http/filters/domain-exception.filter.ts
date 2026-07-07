import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../domain/errors/domain.error';
import { DuplicateSkuError } from '../../../domain/errors/duplicate-sku.error';
import { InvalidProductError } from '../../../domain/errors/invalid-product.error';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';

/** Estructura mínima de la respuesta HTTP (evita depender de @types/express). */
interface HttpResponse {
  status(code: number): { json(body: unknown): void };
}

/**
 * Traduce los errores del dominio a respuestas HTTP con su status apropiado,
 * manteniendo el dominio libre de dependencias del framework web.
 */
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
    if (exception instanceof ProductNotFoundError) return HttpStatus.NOT_FOUND;
    if (exception instanceof DuplicateSkuError) return HttpStatus.CONFLICT;
    if (exception instanceof InvalidProductError) return HttpStatus.BAD_REQUEST;
    return HttpStatus.UNPROCESSABLE_ENTITY;
  }
}
