import {Request, Response} from "express";
import {ReportService} from "../../services/report-service";
import {handleError} from "../helpers/handle-error";
import {UnauthorizedError} from "../../errors";

const sendPdf = (res: Response, file: Buffer, fileName: string, disposition: "inline" | "attachment") => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${disposition}; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(file);
};

export class ReportController {
    private reportService: ReportService;

    constructor() {
        this.reportService = new ReportService();
    }

    async preview(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const file = await this.reportService.preview(userId, req.body);
            return sendPdf(res, file, "thryve-relatorio-previa.pdf", "inline");
        } catch (error) {
            return handleError(res, error);
        }
    }

    async generate(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const report = await this.reportService.generate(userId, req.body);
            return res.status(201).json({
                message: "Report generated successfully",
                report,
            });
        } catch (error) {
            return handleError(res, error);
        }
    }

    async loadAll(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const reports = await this.reportService.loadAll(userId);
            return res.status(200).json({reports});
        } catch (error) {
            return handleError(res, error);
        }
    }

    async download(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const {fileName, file} = await this.reportService.download(userId, req.params);
            return sendPdf(res, file, fileName, "attachment");
        } catch (error) {
            return handleError(res, error);
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            await this.reportService.delete(userId, req.body);
            return res.status(200).json({message: "Report deleted successfully"});
        } catch (error) {
            return handleError(res, error);
        }
    }
}
