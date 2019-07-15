import {
  Catch, ExceptionFilter, ArgumentsHost, HttpStatus, HttpException
}
from '@nestjs/common';

import {
  DetailedError, ValidationError, NotFoundError, ForbiddenError,
  UnauthorizedError
} from 'bsy-error';

@Catch()
/**
 * Custom error handler for use with bsy-error and Formn.  Formn uses bsy-error
 * behind the scenes, and it provides a suite of error classes that are
 * intended for web use.
 * This should be wired up against the app, usually in main.ts
 * app.useGlobalFilters(new BsyErrorHandlerFilter());
 */
export class BsyErrorHandlerFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    const err: DetailedError = this.normalizeError(exception);
    const ctx                = host.switchToHttp();
    const response           = ctx.getResponse();

    switch (err.code) {
      case 'VALIDATION_ERROR':
      case 'VAL_ERROR_LIST':
        response
          .status(HttpStatus.BAD_REQUEST)
          .json(err);
        break;

      case 'UNAUTHORIZED_ERROR':
        response
          .status(HttpStatus.UNAUTHORIZED)
          .json(err);
        break;

      case 'NOT_FOUND_ERROR':
        response
          .status(HttpStatus.NOT_FOUND)
          .json(err);
        break;

      case 'FORBIDDEN_ERROR':
        response
          .status(HttpStatus.FORBIDDEN)
          .json(err);
        break;

      case 'DUPE_ERROR':
        response
          .status(HttpStatus.CONFLICT)
          .json(err);
        break;

      default:
        console.error('Unhandled error occurred.');
        console.error(err);

        response
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({
            detail: 'Oops, an error occurred.  The software development team has been notified.',
            code:   'UNHANDLED_ERROR'
          });
        break;
    }
  }

  /**
   * Helper method to normalize NestJS errors to bsy-errors.
   */
  private normalizeError(err: any): DetailedError | any {
    if (err instanceof DetailedError)
      return err;

    if (err instanceof HttpException) {
      const httpErr = err as HttpException;

      switch (err.getStatus()) {
       case HttpStatus.BAD_REQUEST:
         return new ValidationError(httpErr.message.message, 'request');

       case HttpStatus.NOT_FOUND:
         return new NotFoundError(httpErr.message.message);

       case HttpStatus.FORBIDDEN:
         return new ForbiddenError(httpErr.message.message);

       case HttpStatus.UNAUTHORIZED:
         return new UnauthorizedError(httpErr.message.message);

       default:
         return new DetailedError(httpErr.message.message, 'UNKNOWN_HTTP_ERROR');
      }
    }

    // Maybe a native Error instance, or something with a message.
    if (err.message)
      return new DetailedError(err.message, 'UNHANDLED_ERROR');

    // Absolute failure.  Something other than an Error was thrown.
    console.error('Failed to normalize error');
    console.error(err);

    return new DetailedError('Unknown error.', 'UNKNOWN_ERROR');
  }
}

