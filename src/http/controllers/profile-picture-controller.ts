import {Request, Response} from "express";
import {ProfilePictureService} from "../../services/profile-picture-service";
import {handleError} from "../helpers/handle-error";
import {UnauthorizedError} from "../../errors";

export class ProfilePictureController {
    private profilePictureService: ProfilePictureService

    constructor() {
        this.profilePictureService = new ProfilePictureService()
    }

    async upload(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            const profilePicture = await this.profilePictureService.upload(userId, req.file)

            return res.status(200).json({profilePicture});
        } catch (error) {
            return handleError(res, error);
        }
    }

    async remove(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError();
            }

            await this.profilePictureService.remove(userId)

            return res.status(200).json({message: "Profile picture removed successfully"});
        } catch (error) {
            return handleError(res, error);
        }
    }

    async load(req: Request, res: Response) {
        try {
            const picture = await this.profilePictureService.load(req.params)

            res.set({
                "Content-Type": picture.contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
                "X-Content-Type-Options": "nosniff",
            });

            return res.status(200).send(picture.data);
        } catch (error) {
            return handleError(res, error);
        }
    }
}
