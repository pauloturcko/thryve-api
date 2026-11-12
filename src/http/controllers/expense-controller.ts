import {Request, Response} from "express";
import {TransactionService} from "../../services/transaction-service";
import {handleError} from "../helpers/handle-error";
import {UnauthorizedError} from "../../errors";

export class ExpenseController {
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

            const registeredExpenses = await this.transactionService.createExpense(userId, req.body);

            return res.status(201).json({
                message: "Expense registered successfully",
                registeredExpenses,
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

            const expenses = await this.transactionService.loadExpenses(userId, req.query);
            return res.status(200).json({expenses});
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

            const expense = await this.transactionService.updateExpense(userId, req.body);
            return res.status(200).json({expense});
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

            await this.transactionService.deleteExpense(userId, req.body);
            return res.status(200).json({message: "Expense deleted successfully"});
        } catch (error) {
            return handleError(res, error);
        }
    }
}
