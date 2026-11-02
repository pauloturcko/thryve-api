import {Router} from "express";
import {ExpenseController} from "../controllers/expense-controller";
import {authMiddleware} from "../middlewares/auth-middleware";

const expenseRouter = Router()
const expenseController = new ExpenseController()

expenseRouter.post('/register', authMiddleware, (req, res) => expenseController.register(req, res));
expenseRouter.get('/user-expenses', authMiddleware, (req, res) => expenseController.loadAll(req, res));
expenseRouter.patch('/update', authMiddleware, (req, res) => expenseController.update(req, res));
expenseRouter.delete('/delete', authMiddleware, (req, res) => expenseController.delete(req, res));

export {expenseRouter};
