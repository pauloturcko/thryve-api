import {Request, Response} from "express";
import {TransactionService} from "../../services/transaction-service";
import {handleError} from "../helpers/handle-error";

export class IncomeController {
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
                return res.status(401).json({message: "Unauthorized"});
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
                return res.status(401).json({message: "Unauthorized"});
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
                return res.status(401).json({message: "Unauthorized"});
            }

            await this.transactionService.deleteIncome(userId, req.body);
            return res.status(200).json({message: "Income deleted successfully"});
        } catch (error) {
            return handleError(res, error);
        }
    }
}
