import {Request, Response} from "express";
import {InvestmentService} from "../../services/investment-service";
import {handleError} from "../helpers/handle-error";
import {UnauthorizedError} from "../../errors";

export class InvestmentController {
    private investmentService: InvestmentService;

    constructor() {
        this.investmentService = new InvestmentService();
    }

    async register(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const registeredInvestment = await this.investmentService.create(userId, req.body);

            return res.status(201).json({
                message: "Investment registered successfully",
                registeredInvestment,
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

            const investments = await this.investmentService.loadAll(userId, req.query);
            return res.status(200).json({investments});
        } catch (error) {
            return handleError(res, error);
        }
    }

    async update(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const investment = await this.investmentService.update(userId, req.body);
            return res.status(200).json({investment});
        } catch (error) {
            return handleError(res, error);
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            await this.investmentService.delete(userId, req.body);
            return res.status(200).json({message: "Investment deleted successfully"});
        } catch (error) {
            return handleError(res, error);
        }
    }

    async updateValue(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const registeredMovement = await this.investmentService.updateValue(userId, req.body);
            return res.status(201).json({
                message: "Investment value updated successfully",
                registeredMovement,
            });
        } catch (error) {
            return handleError(res, error);
        }
    }

    async registerMovement(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const registeredMovement = await this.investmentService.createMovement(userId, req.body);
            return res.status(201).json({
                message: "Investment movement registered successfully",
                registeredMovement,
            });
        } catch (error) {
            return handleError(res, error);
        }
    }

    async loadMovements(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const movements = await this.investmentService.loadMovements(userId, req.query);
            return res.status(200).json({movements});
        } catch (error) {
            return handleError(res, error);
        }
    }

    async updateMovement(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const movement = await this.investmentService.updateMovement(userId, req.body);
            return res.status(200).json({movement});
        } catch (error) {
            return handleError(res, error);
        }
    }

    async deleteMovement(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            await this.investmentService.deleteMovement(userId, req.body);
            return res.status(200).json({message: "Investment movement deleted successfully"});
        } catch (error) {
            return handleError(res, error);
        }
    }
}
