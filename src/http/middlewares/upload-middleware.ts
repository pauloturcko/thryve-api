import {NextFunction, Request, Response} from "express";
import multer from "multer";
import {handleError} from "../helpers/handle-error";

const MAX_PROFILE_PICTURE_BYTES = 5 * 1024 * 1024;

// memoryStorage: o arquivo fica só em req.file.buffer e nunca toca o disco
const uploadSingleFile = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: MAX_PROFILE_PICTURE_BYTES, files: 1},
}).single("file");

// Erro do multer (arquivo grande demais, campo com outro nome) acontece antes do controller e não chegaria no catch dele, por isso o handleError é chamado aqui.
export function profilePictureUpload(req: Request, res: Response, next: NextFunction) {
    uploadSingleFile(req, res, (error) => error ? handleError(res, error) : next());
}
