import {Request, Response} from "express";
import {IndexRateService} from "../../services/index-rate-service";
import {handleError} from "../helpers/handle-error";
import {UnauthorizedError} from "../../errors";

export class IndexRateController {
    private indexRateService: IndexRateService;

    constructor() {
        this.indexRateService = new IndexRateService();
    }

    async loadCurrent(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const indexes = await this.indexRateService.loadCurrent();
            return res.status(200).json({indexes});
        } catch (error) {
            return handleError(res, error);
        }
    }
}
