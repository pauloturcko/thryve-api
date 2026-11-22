import { z } from "zod";
import { PluggyWebhookEventRepository } from "../db/repository/pluggy-webhook-event-repository";
import { isValidPluggySignature } from "../utils/pluggy-signature";
import { OpenFinanceService } from "./open-finance-service";

const webhookPayloadValidator = z.object({
    event: z.string().min(1),
    eventId: z.string().min(1),
    itemId: z.uuid().optional(),
    error: z.object({code: z.string().optional(), message: z.string().optional()}).passthrough().optional(),
}).passthrough();

type WebhookPayload = z.infer<typeof webhookPayloadValidator>;

export type WebhookResult = {status: number, body: Record<string, unknown>};

const signingSecrets = () =>
    (process.env.PLUGGY_WEBHOOK_SECRET ?? "")
        .split(",")
        .map((secret) => secret.trim())
        .filter(Boolean);

export class OpenFinanceWebhookService {
    private eventRepository = new PluggyWebhookEventRepository();
    private openFinanceService = new OpenFinanceService();

    async receive(rawBody: Buffer, signatureHeader: string | undefined): Promise<WebhookResult> {
        const secrets = signingSecrets();
        if (secrets.length === 0) {
            console.error("Webhook do Pluggy recebido sem PLUGGY_WEBHOOK_SECRET configurado; evento recusado.");
            return {status: 503, body: {received: false}};
        }
        if (!isValidPluggySignature(rawBody, signatureHeader, secrets)) {
            return {status: 401, body: {received: false}};
        }

        let payload: WebhookPayload;
        try {
            payload = webhookPayloadValidator.parse(JSON.parse(rawBody.toString("utf8")));
        } catch {
            return {status: 400, body: {received: false}};
        }

        const id = await this.eventRepository.insertIfNew({
            eventId: payload.eventId,
            event: payload.event,
            itemId: payload.itemId ?? null,
            payload,
        });
        if (id === null) return {status: 200, body: {received: true, duplicate: true}};

        setImmediate(() => void this.process(id, payload));
        return {status: 200, body: {received: true}};
    }

    private async process(id: number, payload: WebhookPayload): Promise<void> {
        try {
            await this.handle(payload);
            await this.eventRepository.markProcessed(id);
        } catch (error) {
            console.error(`Falha ao processar o webhook ${payload.event} (${payload.eventId})`, error);
            await this.eventRepository
                .markProcessed(id, error instanceof Error ? error.message : String(error))
                .catch((markError) => console.error("Falha ao registrar o erro do webhook", markError));
        }
    }

    private async handle({event, itemId, error}: WebhookPayload): Promise<void> {
        if (!itemId) return;

        switch (event) {
            case "item/created":
            case "item/updated":
            case "item/login_succeeded":
                await this.openFinanceService.syncItem(itemId);
                break;
            case "item/error":
                console.warn(`Item ${itemId} com erro no Pluggy: ${error?.code ?? "sem código"} ${error?.message ?? ""}`);
                await this.openFinanceService.syncItem(itemId);
                break;
            case "item/deleted":
                await this.openFinanceService.removeItem(itemId);
                break;
            default:
                break;
        }
    }
}
