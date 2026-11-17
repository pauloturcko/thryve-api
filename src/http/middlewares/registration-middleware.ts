import {timingSafeEqual} from "node:crypto";
import {NextFunction, Request, Response} from "express";
import {ErrorCode} from "../../errors";

// Cadastro fechado ao público: só passa quem envia no header x-registration-key a mesma chave
// definida em REGISTRATION_KEY. Sem a variável configurada, ninguém consegue se cadastrar.
const isSameKey = (received: string, expected: string) => {
    const receivedBuffer = Buffer.from(received);
    const expectedBuffer = Buffer.from(expected);

    return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function registrationMiddleware(req: Request, res: Response, next: NextFunction) {
    const expectedKey = process.env.REGISTRATION_KEY;
    const receivedKey = req.headers["x-registration-key"];

    if (!expectedKey || typeof receivedKey !== "string" || !isSameKey(receivedKey, expectedKey)) {
        res.status(403).json({code: ErrorCode.registrationDisabled, message: "Registration is disabled"});
        return;
    }

    next();
}
