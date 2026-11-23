import {Router} from "express";
import {ExpenseDraftController} from "../controllers/expense-draft-controller";
import {authMiddleware} from "../middlewares/auth-middleware";

const expenseDraftRouter = Router()
const expenseDraftController = new ExpenseDraftController()

expenseDraftRouter.get('/context', authMiddleware, (req, res) => expenseDraftController.context(req, res));
expenseDraftRouter.post('/register', authMiddleware, (req, res) => expenseDraftController.register(req, res));
expenseDraftRouter.get('/user-drafts', authMiddleware, (req, res) => expenseDraftController.loadAll(req, res));
expenseDraftRouter.post('/confirm', authMiddleware, (req, res) => expenseDraftController.confirm(req, res));
expenseDraftRouter.delete('/delete', authMiddleware, (req, res) => expenseDraftController.delete(req, res));

export {expenseDraftRouter};
