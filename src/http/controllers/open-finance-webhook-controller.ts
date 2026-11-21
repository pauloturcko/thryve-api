import {Request, Response} from "express";
import {OpenFinanceWebhookService} from "../../services/open-finance-webhook-service";
import {handleError} from "../helpers/handle-error";

export class OpenFinanceWebhookController {
    private webhookService: OpenFinanceWebhookService;

    constructor() {
        this.webhookService = new OpenFinanceWebhookService();
    }

    async pluggy(req: Request, res: Response) {
        try {
            const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
            const {status, body} = await this.webhookService.receive(rawBody, req.header("x-pluggy-signature"));

            return res.status(status).json(body);
        } catch (error) {
            return handleError(res, error);
        }
    }
}
