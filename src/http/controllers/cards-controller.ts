import {Request, Response} from "express";
import {CardsService} from "../../services/cards-service";
import {handleError} from "../helpers/handle-error";
import {UnauthorizedError} from "../../errors";

export class CardsController {
    private cardService: CardsService;

    constructor() {
        this.cardService = new CardsService();
    }

    async register(req: Request, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                throw new UnauthorizedError();
            }

            const registeredCard = await this.cardService.create(userId, req.body);

            res.status(201).json({
                message: "Card registered successfully",
                registeredCard,
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

            const cards = await this.cardService.loadAll(userId)
            res.status(200).json({cards})
        } catch (error) {
            return handleError(res, error);
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const card = await this.cardService.update(userId, req.body)
            res.status(200).json({card})
        } catch (error) {
            return handleError(res, error);
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            await this.cardService.delete(userId, req.body);
            res.status(200).json({message: "Card deleted successfully"})
        } catch (error) {
            return handleError(res, error);
        }
    }
}
