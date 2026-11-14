import {Router} from "express";
import {InvestmentController} from "../controllers/investment-controller";
import {authMiddleware} from "../middlewares/auth-middleware";

const investmentRouter = Router()
const investmentController = new InvestmentController()

investmentRouter.post('/register', authMiddleware, (req, res) => investmentController.register(req, res));
investmentRouter.get('/user-investments', authMiddleware, (req, res) => investmentController.loadAll(req, res));
investmentRouter.patch('/update', authMiddleware, (req, res) => investmentController.update(req, res));
investmentRouter.delete('/delete', authMiddleware, (req, res) => investmentController.delete(req, res));
investmentRouter.post('/update-value', authMiddleware, (req, res) => investmentController.updateValue(req, res));

investmentRouter.post('/movements/register', authMiddleware, (req, res) => investmentController.registerMovement(req, res));
investmentRouter.get('/movements', authMiddleware, (req, res) => investmentController.loadMovements(req, res));
investmentRouter.patch('/movements/update', authMiddleware, (req, res) => investmentController.updateMovement(req, res));
investmentRouter.delete('/movements/delete', authMiddleware, (req, res) => investmentController.deleteMovement(req, res));

export {investmentRouter};
