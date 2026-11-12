import {z} from "zod";

export const uploadProfilePictureValidator = z.object(
    {buffer: z.instanceof(Buffer)},
    {error: "Envie a imagem no campo \"file\" de um multipart/form-data"},
)
export const profilePictureIdValidator = z.object({
    id: z.uuid(),
})
