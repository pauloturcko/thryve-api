import {Request, Response} from "express";
import {TransactionService} from "../../services/transaction-service";
import {handleError} from "../helpers/handle-error";
import {UnauthorizedError} from "../../errors";

export class IncomeController {
    private transactionService: TransactionService;

    constructor() {
        this.transactionService = new TransactionService();
    }

    async register(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const registeredIncome = await this.transactionService.createIncome(userId, req.body);

            return res.status(201).json({
                message: "Income registered successfully",
                registeredIncome,
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

            const incomes = await this.transactionService.loadIncomes(userId, req.query);
            return res.status(200).json({incomes});
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

            const income = await this.transactionService.updateIncome(userId, req.body);
            return res.status(200).json({income});
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

            await this.transactionService.deleteIncome(userId, req.body);
            return res.status(200).json({message: "Income deleted successfully"});
        } catch (error) {
            return handleError(res, error);
        }
    }
}
