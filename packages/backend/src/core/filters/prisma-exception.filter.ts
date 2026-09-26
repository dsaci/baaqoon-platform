import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Response } from "express";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "حدث خطأ في قاعدة البيانات";

    switch (exception.code) {
      case "P2002":
        status = HttpStatus.CONFLICT;
        message = "هذا السجل موجود مسبقاً (تكرار قيمة فريدة)";
        break;
      case "P2025":
        status = HttpStatus.NOT_FOUND;
        message = "السجل المطلوب غير موجود";
        break;
      case "P2003":
        status = HttpStatus.BAD_REQUEST;
        message = "عملية غير صالحة، هناك بيانات مرتبطة تمنع التنفيذ";
        break;
    }

    response.status(status).json({
      statusCode: status,
      error: "Database Error",
      message: message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
