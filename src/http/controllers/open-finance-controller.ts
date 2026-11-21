import {Request, Response} from "express";
import {OpenFinanceService} from "../../services/open-finance-service";
import {handleError} from "../helpers/handle-error";
import {UnauthorizedError} from "../../errors";

export class OpenFinanceController {
    private openFinanceService: OpenFinanceService;

    constructor() {
        this.openFinanceService = new OpenFinanceService();
    }

    async createConnectToken(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const {accessToken} = await this.openFinanceService.createConnectToken(userId, req.body);
            res.setHeader("Cache-Control", "no-store");
            return res.status(200).json({accessToken});
        } catch (error) {
            return handleError(res, error);
        }
    }

    async registerItem(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const item = await this.openFinanceService.registerItem(userId, req.body);
            return res.status(201).json({
                message: "Open Finance item registered successfully",
                item,
            });
        } catch (error) {
            return handleError(res, error);
        }
    }

    async loadAll(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const items = await this.openFinanceService.loadAll(userId);
            return res.status(200).json({items});
        } catch (error) {
            return handleError(res, error);
        }
    }
}
