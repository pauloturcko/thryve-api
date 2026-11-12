import {AppError} from "./app-error";
import {ErrorCode} from "./error-code";

export class ForbiddenError extends AppError {
    constructor(code = ErrorCode.forbidden, message = "Forbidden") {
        super(code, message);
        this.name = "ForbiddenError";
    }
}
