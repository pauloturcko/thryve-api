import {Router} from "express";
import {ReportController} from "../controllers/report-controller";
import {authMiddleware} from "../middlewares/auth-middleware";

const reportRouter = Router()
const reportController = new ReportController()

reportRouter.post('/preview', authMiddleware, (req, res) => reportController.preview(req, res));
reportRouter.post('/generate', authMiddleware, (req, res) => reportController.generate(req, res));
reportRouter.get('/user-reports', authMiddleware, (req, res) => reportController.loadAll(req, res));
reportRouter.get('/:id/download', authMiddleware, (req, res) => reportController.download(req, res));
reportRouter.delete('/delete', authMiddleware, (req, res) => reportController.delete(req, res));

export {reportRouter};
