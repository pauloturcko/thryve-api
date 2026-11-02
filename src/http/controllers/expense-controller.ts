import {Request, Response} from "express";
import {TransactionService} from "../../services/transaction-service";
import {handleError} from "../helpers/handle-error";

export class ExpenseController {
    private transactionService: TransactionService;

    constructor() {
        this.transactionService = new TransactionService();
    }

    async register(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({message: "Unauthorized"});
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
                return res.status(401).json({message: "Unauthorized"});
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
                return res.status(401).json({message: "Unauthorized"});
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
                return res.status(401).json({message: "Unauthorized"});
            }

            await this.transactionService.deleteExpense(userId, req.body);
            return res.status(200).json({message: "Expense deleted successfully"});
        } catch (error) {
            return handleError(res, error);
        }
    }
}
