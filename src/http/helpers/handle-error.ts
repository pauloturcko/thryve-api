import type {Response} from "express";
import {ZodError} from "zod";
import {BusinessRuleError, ForbiddenError, GenericError, NotFoundError, UnauthorizedError} from "../../errors";

// Único ponto que traduz erro → status HTTP. Todo controller termina o catch chamando isso.
export function handleError(res: Response, error: unknown) {
    if (error instanceof ZodError) {
        return res.status(400).json({
            message: "Validation error",
            errors: error.issues.map((issue) => ({
                path: issue.path.map(String).join("."),
                message: issue.message,
            })),
        });
    }

    if (error instanceof UnauthorizedError) {
        return res.status(401).json({message: error.message});
    }

    if (error instanceof ForbiddenError) {
        return res.status(403).json({message: error.message});
    }

    if (error instanceof NotFoundError) {
        return res.status(404).json({message: error.message});
    }

    if (error instanceof BusinessRuleError) {
        return res.status(422).json({message: error.message});
    }

    if (error instanceof GenericError) {
        return res.status(409).json({message: error.message});
    }

    // O detalhe fica só no log: um QueryFailedError serializado expõe a query SQL e os parâmetros pro cliente.
    console.error(error);
    return res.status(500).json({message: "Internal server error"});
}
