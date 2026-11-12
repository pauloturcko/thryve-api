import {AppError} from "./app-error";
import {ErrorCode} from "./error-code";

export class BusinessRuleError extends AppError {
    constructor(code: ErrorCode, message: string) {
        super(code, message);
        this.name = "BusinessRuleError";
    }
}
