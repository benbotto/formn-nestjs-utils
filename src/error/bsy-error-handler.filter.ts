import {
  Catch, ExceptionFilter, ArgumentsHost, HttpStatus, HttpException
}
from '@nestjs/common';

import {
  DetailedError, ValidationError, NotFoundError, ForbiddenError,
  UnauthorizedError
} from 'bsy-error';

/**
 * Custom error handler for use with bsy-error and Formn.  Formn uses bsy-error
 * behind the scenes, and it provides a suite of error classes that are
 * intended for web use.
 * This should be wired up against the app, usually in main.ts
 * app.useGlobalFilters(new BsyErrorHandlerFilter());
 */
@Catch()
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
        this.onUnhandledError(err, host);
        break;
    }
  }

  /**
   * This allows sub-classes to capture unhandled exceptions and handle them in
   * an application-specific way (e.g. send an email with a stacktrace).  By
   * default it just logs the error to the terminal.
   */
  onUnhandledError(err: DetailedError, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse();

    console.error('Unhandled error occurred.');
    console.error(err);

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({
        detail: 'Oops, an error occurred.  The software development team has been notified.',
        code:   'UNHANDLED_ERROR'
      });
  }

  /**
   * Helper method to normalize NestJS errors to bsy-errors.
   */
  private normalizeError(err: any): DetailedError | any {
    if (err instanceof DetailedError)
      return err;

    if (err instanceof HttpException) {
      const httpErr = err as HttpException;
      let detailedError;

      switch (err.getStatus()) {
       case HttpStatus.BAD_REQUEST:
         detailedError = new ValidationError(httpErr.message.message, 'request');

       case HttpStatus.NOT_FOUND:
         detailedError = new NotFoundError(httpErr.message.message);

       case HttpStatus.FORBIDDEN:
         detailedError = new ForbiddenError(httpErr.message.message);

       case HttpStatus.UNAUTHORIZED:
         detailedError = new UnauthorizedError(httpErr.message.message);

       default:
         detailedError = new DetailedError(httpErr.message.message, 'UNKNOWN_HTTP_ERROR');
      }

      // Preserve the original stack trace.
      detailedError.stack = err.stack;

      return detailedError;
    }

    // Maybe a native Error instance, or something with a message.
    if (err.message) {
      const detailedError = new DetailedError(err.message, 'UNHANDLED_ERROR');

      detailedError.stack = err.stack;

      return detailedError;
    }

    // Absolute failure.  Something other than an Error was thrown.
    console.error('Failed to normalize error');
    console.error(err);

    return new DetailedError('Unknown error.', 'UNKNOWN_ERROR');
  }
}
