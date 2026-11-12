import {Request, Response} from "express";
import {UserSystemPreferencesService} from "../../services/user-system-preferences-service";
import {handleError} from "../helpers/handle-error";

export class SystemPreferencesController {
    private userSystemPreferencesService: UserSystemPreferencesService

    constructor() {
        this.userSystemPreferencesService = new UserSystemPreferencesService()
    }

    async update(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({message: "Unauthorized"});
            }

            const systemPreferences = await this.userSystemPreferencesService.updatePreference(userId, req.body)

            return res.status(200).json({systemPreferences});
        } catch (error) {
            return handleError(res, error);
        }
    }
}
