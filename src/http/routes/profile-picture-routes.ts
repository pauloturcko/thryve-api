import {Router} from "express";
import {ProfilePictureController} from "../controllers/profile-picture-controller";
import {authMiddleware} from "../middlewares/auth-middleware";
import {profilePictureUpload} from "../middlewares/upload-middleware";

const profilePictureRouter = Router()
const profilePictureController = new ProfilePictureController()

profilePictureRouter.post('/upload', authMiddleware, profilePictureUpload, (req, res) => profilePictureController.upload(req, res));
profilePictureRouter.delete('/delete', authMiddleware, (req, res) => profilePictureController.remove(req, res));
profilePictureRouter.get('/:id', (req, res) => profilePictureController.load(req, res));

export {profilePictureRouter};
