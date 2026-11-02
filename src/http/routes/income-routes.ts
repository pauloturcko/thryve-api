import {Router} from "express";
import {IncomeController} from "../controllers/income-controller";
import {authMiddleware} from "../middlewares/auth-middleware";

const incomeRouter = Router()
const incomeController = new IncomeController()

incomeRouter.post('/register', authMiddleware, (req, res) => incomeController.register(req, res));
incomeRouter.get('/user-incomes', authMiddleware, (req, res) => incomeController.loadAll(req, res));
incomeRouter.patch('/update', authMiddleware, (req, res) => incomeController.update(req, res));
incomeRouter.delete('/delete', authMiddleware, (req, res) => incomeController.delete(req, res));

export {incomeRouter};
