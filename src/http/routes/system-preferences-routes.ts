import {Router} from "express";
import {SystemPreferencesController} from "../controllers/system-preferences-controller";
import {authMiddleware} from "../middlewares/auth-middleware";

const systemPreferencesRouter = Router()
const systemPreferencesController = new SystemPreferencesController()

systemPreferencesRouter.patch('/update', authMiddleware, (req, res) => systemPreferencesController.update(req, res));

export {systemPreferencesRouter};
