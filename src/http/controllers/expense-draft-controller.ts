import {Request, Response} from "express";
import {ExpenseDraftService} from "../../services/expense-draft-service";
import {handleError} from "../helpers/handle-error";
import {UnauthorizedError} from "../../errors";

export class ExpenseDraftController {
    private expenseDraftService: ExpenseDraftService;

    constructor() {
        this.expenseDraftService = new ExpenseDraftService();
    }

    async context(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const context = await this.expenseDraftService.loadContext(userId);
            return res.status(200).json(context);
        } catch (error) {
            return handleError(res, error);
        }
    }

    async register(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const draft = await this.expenseDraftService.create(userId, req.body);
            return res.status(201).json({draft});
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

            const drafts = await this.expenseDraftService.loadAll(userId);
            return res.status(200).json({drafts});
        } catch (error) {
            return handleError(res, error);
        }
    }

    async confirm(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const registeredExpenses = await this.expenseDraftService.confirm(userId, req.body);
            return res.status(201).json({
                message: "Expense registered successfully",
                registeredExpenses,
            });
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

            await this.expenseDraftService.delete(userId, req.body);
            return res.status(200).json({message: "Expense draft deleted successfully"});
        } catch (error) {
            return handleError(res, error);
        }
    }
}
