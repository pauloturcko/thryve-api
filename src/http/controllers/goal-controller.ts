import {Request, Response} from "express";
import {GoalService} from "../../services/goal-service";
import {handleError} from "../helpers/handle-error";
import {UnauthorizedError} from "../../errors";

export class GoalController {
    private goalService: GoalService;

    constructor() {
        this.goalService = new GoalService();
    }

    async register(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const registeredGoal = await this.goalService.create(userId, req.body);

            return res.status(201).json({
                message: "Goal registered successfully",
                registeredGoal,
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

            const goals = await this.goalService.loadAll(userId, req.query);
            return res.status(200).json({goals});
        } catch (error) {
            return handleError(res, error);
        }
    }

    async update(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const goal = await this.goalService.update(userId, req.body);
            return res.status(200).json({goal});
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

            await this.goalService.delete(userId, req.body);
            return res.status(200).json({message: "Goal deleted successfully"});
        } catch (error) {
            return handleError(res, error);
        }
    }
}
