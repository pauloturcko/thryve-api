import {AppError} from "./app-error";
import {ErrorCode} from "./error-code";

export class UnauthorizedError extends AppError {
    constructor(code = ErrorCode.unauthorized, message = "Unauthorized") {
        super(code, message);
        this.name = "UnauthorizedError";
    }
}
