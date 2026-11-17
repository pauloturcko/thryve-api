import {Router} from "express";
import {UsersController} from "../controllers/users-controller";
import {authMiddleware} from "../middlewares/auth-middleware";
import {registrationMiddleware} from "../middlewares/registration-middleware";

const userRouter = Router()
const userController = new UsersController();

userRouter.post('/register', registrationMiddleware, (req, res) => userController.register(req, res));
userRouter.get('/me', authMiddleware, (req, res) => userController.getLoggedUser(req, res))

export { userRouter };