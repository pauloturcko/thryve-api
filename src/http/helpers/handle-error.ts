import type {Response} from "express";
import {MulterError} from "multer";
import {ZodError} from "zod";
import {
    AppError,
    BusinessRuleError,
    ErrorCode,
    ForbiddenError,
    GenericError,
    NotFoundError,
    UnauthorizedError,
} from "../../errors";

type ZodIssue = ZodError["issues"][number];

const issueCode = (issue: ZodIssue): string => {
    if (issue.code === "custom" && typeof issue.params?.code === "string") {
        return issue.params.code;
    }
    return issue.code;
};

const statusByError = (error: AppError): number => {
    if (error instanceof UnauthorizedError) return 401;
    if (error instanceof ForbiddenError) return 403;
    if (error instanceof NotFoundError) return 404;
    if (error instanceof BusinessRuleError) return 422;
    if (error instanceof GenericError) return 409;
    return 500;
};

export function handleError(res: Response, error: unknown) {
    if (error instanceof ZodError) {
        return res.status(400).json({
            code: ErrorCode.validationError,
            message: "Validation error",
            errors: error.issues.map((issue) => ({
                path: issue.path.map(String).join("."),
                code: issueCode(issue),
                message: issue.message,
            })),
        });
    }

    if (error instanceof MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                code: ErrorCode.profilePictureTooLarge,
                message: "A imagem deve ter no máximo 5MB",
            });
        }
        return res.status(400).json({code: ErrorCode.profilePictureUploadError, message: error.message});
    }

    if (error instanceof AppError) {
        return res.status(statusByError(error)).json({code: error.code, message: error.message});
    }

    console.error(error);
    return res.status(500).json({code: ErrorCode.internalError, message: "Internal server error"});
}
