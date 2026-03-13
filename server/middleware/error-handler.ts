import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = "APP_ERROR", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export function asyncHandler(handler: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function isUnsupportedMediaTypeError(error: unknown): error is Error {
  return error instanceof Error && error.message.startsWith("Tipo de archivo no permitido:");
}

function mapMulterError(error: multer.MulterError | Error): AppError {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return new AppError("Uploaded file exceeds the 5MB limit.", 413, "LIMIT_FILE_SIZE");
      case "LIMIT_FILE_COUNT":
      case "LIMIT_UNEXPECTED_FILE":
      case "LIMIT_PART_COUNT":
        return new AppError("Too many files were uploaded in a single request.", 413, error.code);
      default:
        return new AppError("File upload failed.", 400, error.code);
    }
  }

  if (isUnsupportedMediaTypeError(error)) {
    return new AppError(error.message, 415, "UNSUPPORTED_MEDIA_TYPE");
  }

  return new AppError((error as any).message || "File upload failed.", 400, "UPLOAD_ERROR");
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof multer.MulterError || isUnsupportedMediaTypeError(error)) {
    return mapMulterError(error as multer.MulterError | Error);
  }

  if (error instanceof ZodError) {
    return new AppError("Validation error.", 400, "VALIDATION_ERROR", error.errors);
  }

  const statusCode = typeof (error as { status?: unknown; statusCode?: unknown })?.status === "number"
    ? (error as { status: number }).status
    : typeof (error as { statusCode?: unknown })?.statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : 500;

  if (error instanceof Error) {
    return new AppError(
      statusCode >= 500 ? "Internal Server Error" : error.message,
      statusCode,
      statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR",
    );
  }

  return new AppError("Internal Server Error", 500, "INTERNAL_SERVER_ERROR");
}

export function globalErrorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    return next(error);
  }

  const appError = toAppError(error);
  const statusCode = appError.statusCode;
  const logPayload = {
    err: error,
    userId: req.user?.id,
    method: req.method,
    path: req.originalUrl,
    contentLength: req.headers["content-length"],
    reason: appError.code,
  };

  if (statusCode >= 500) {
    logger.error(logPayload, "Unhandled server error");
  } else {
    logger.warn(logPayload, "Request rejected");
  }

  const responseBody: Record<string, unknown> = {
    error: appError.code,
    message: appError.message,
  };

  if (appError.details !== undefined) {
    responseBody.details = appError.details;
  }

  return res.status(statusCode).json(responseBody);
}
