import {PaymentMethodsService} from "../../services/payment-methods-service";
import {Request, Response} from "express";
import {handleError} from "../helpers/handle-error";
import {UnauthorizedError} from "../../errors";

export class PaymentMethodsController {
    private paymentMethodsService: PaymentMethodsService

    constructor() {
        this.paymentMethodsService = new PaymentMethodsService()
    }

    async list(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const preferences = await this.paymentMethodsService.getUserPreferences(userId)

            return res.status(200).json(preferences);

        } catch (error) {
            return handleError(res, error);
        }
    }

    async toggle(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if(!userId) {
                throw new UnauthorizedError();
            }

            const updated = await this.paymentMethodsService.togglePreference(userId, req.params)

            return res.status(200).json(updated)
        } catch (error) {
            return handleError(res, error);
        }
    }
}
