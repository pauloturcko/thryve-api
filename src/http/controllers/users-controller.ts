import type {Request, Response} from "express";
import {UsersService} from "../../services/users-service";
import {handleError} from "../helpers/handle-error";
import {UnauthorizedError} from "../../errors";

export class UsersController {
    private userService: UsersService;

    constructor() {
        this.userService = new UsersService();
    }

    async register(req: Request, res: Response) {
        try {
            const user = await this.userService.register(req.body);

            // Mapeado à mão: o save() do TypeORM devolve o objeto inserido, com o hash da senha (o select: false só vale pra SELECT).
            res.status(201).json({
                message: "User registered successfully",
                result: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt,
                    profilePicture: user.profilePicture,
                },
            });
        } catch (error) {
            return handleError(res, error);
        }
    }

    async getLoggedUser(req: Request, res: Response) {
        try {
            const {user} = req;

            if (!user) {
                throw new UnauthorizedError();
            }

            const savedUser = await this.userService.getLoggedUser(user.id);

            return res.status(200).json({
                user: {
                    id: savedUser.user.id,
                    name: savedUser.user.name,
                    email: savedUser.user.email,
                    createdAt: savedUser.user.createdAt,
                    profilePicture: savedUser.user.profilePicture,
                },
                systemPreferences: savedUser.systemPreferences,
                paymentPreferences: savedUser.paymentPreferences,
            });
        } catch (error) {
            return handleError(res, error);
        }
    }
}
