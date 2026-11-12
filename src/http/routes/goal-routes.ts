import {Router} from "express";
import {GoalController} from "../controllers/goal-controller";
import {authMiddleware} from "../middlewares/auth-middleware";

const goalRouter = Router()
const goalController = new GoalController()

goalRouter.post('/register', authMiddleware, (req, res) => goalController.register(req, res));
goalRouter.get('/user-goals', authMiddleware, (req, res) => goalController.loadAll(req, res));
goalRouter.patch('/update', authMiddleware, (req, res) => goalController.update(req, res));
goalRouter.delete('/delete', authMiddleware, (req, res) => goalController.delete(req, res));

export {goalRouter};
