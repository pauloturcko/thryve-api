import {Router} from "express";
import {IndexRateController} from "../controllers/index-rate-controller";
import {authMiddleware} from "../middlewares/auth-middleware";

const indexRateRouter = Router()
const indexRateController = new IndexRateController()

indexRateRouter.get('/current', authMiddleware, (req, res) => indexRateController.loadCurrent(req, res));

export {indexRateRouter};
