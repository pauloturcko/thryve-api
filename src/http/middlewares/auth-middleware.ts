import {NextFunction, Request, Response} from "express";
import {verifyToken} from "../../utils/jwt";
import {UsersRepository} from "../../db/repository/users-repository";
import {ErrorCode} from "../../errors";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeaders = req.headers.authorization;
    if(!authHeaders) {
        res.status(401).json({code: ErrorCode.unauthorized, message: "Unauthorized"})
        return;
    }

    const token = authHeaders.split(' ')[1];

    try{
        const decoded = verifyToken(token!)

        const userRepository = new UsersRepository()
        const user = await userRepository.loadById(decoded.userId)
        if(!user) {
            res.status(401).json({code: ErrorCode.unauthorized, message: "Unauthorized"})
            return;
        }

        req.user = {
            id: user.id,
            email: user.email
        }

        next()
    }catch(error){
        return res.status(401).json({code: ErrorCode.unauthorized, message: "Unauthorized"});
    }
}