import {z} from "zod";

const itemIdValidator = z.uuid("Item inválido");

export const connectTokenValidator = z.object({
    itemId: itemIdValidator.optional(),
});

export const registerItemValidator = z.object({
    itemId: itemIdValidator,
});
