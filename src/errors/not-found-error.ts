import {AppError} from "./app-error";
import {ErrorCode} from "./error-code";

export class NotFoundError extends AppError {
    constructor(code: ErrorCode, message = "Not found") {
        super(code, message);
        this.name = "NotFoundError";
    }
}
