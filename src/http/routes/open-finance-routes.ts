import {Router} from "express";
import {OpenFinanceController} from "../controllers/open-finance-controller";
import {authMiddleware} from "../middlewares/auth-middleware";

const openFinanceRouter = Router()
const openFinanceController = new OpenFinanceController()

openFinanceRouter.post('/connect-token', authMiddleware, (req, res) => openFinanceController.createConnectToken(req, res));
openFinanceRouter.post('/items/register', authMiddleware, (req, res) => openFinanceController.registerItem(req, res));
openFinanceRouter.get('/items/user-items', authMiddleware, (req, res) => openFinanceController.loadAll(req, res));

export {openFinanceRouter};
