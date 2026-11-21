import { createHmac, timingSafeEqual } from "crypto";

// Tolerância do timestamp assinado: acima disso o evento é tratado como replay.
const MAX_AGE_SECONDS = 5 * 60;

// Header no formato "t=<unix segundos>,v1=<hmac em hex>".
const parseHeader = (header: string) => {
    const parts = Object.fromEntries(header.split(",").map((part) => {
        const [key, ...rest] = part.trim().split("=");
        return [key, rest.join("=")];
    }));

    return {timestamp: parts.t, signature: parts.v1};
};

// Confere o X-Pluggy-Signature: HMAC-SHA256 de "<t>.<corpo bruto>" com o segredo inteiro (inclusive o
// prefixo whsec_), em hex. Aceita mais de um segredo para a troca de chave: o Pluggy assina só com o novo
// assim que ele é gerado, então durante a troca os dois precisam valer.
export const isValidPluggySignature = (
    rawBody: Buffer,
    header: string | undefined,
    secrets: string[],
    now: number = Date.now(),
): boolean => {
    if (!header || secrets.length === 0) return false;

    const {timestamp, signature} = parseHeader(header);
    if (!timestamp || !/^\d+$/.test(timestamp) || !signature || !/^[0-9a-f]{64}$/.test(signature)) return false;
    if (Math.abs(now / 1000 - Number(timestamp)) > MAX_AGE_SECONDS) return false;

    const received = Buffer.from(signature, "hex");
    const signedPayload = Buffer.concat([Buffer.from(`${timestamp}.`, "utf8"), rawBody]);

    return secrets.some((secret) => {
        const expected = createHmac("sha256", secret).update(signedPayload).digest();
        return timingSafeEqual(expected, received);
    });
};
