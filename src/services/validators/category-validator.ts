import {z} from "zod";
import {CategoryTypeEnum} from "../../db/enum/category-type-enum";
import {idValidator, nameValidator} from "./common-validator";

export const createCategoryValidator = z.object({
    name: nameValidator,

    icon: z
        .string()
        .trim()
        .min(1)
        .max(50),

    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),

    type: z.enum(CategoryTypeEnum),
});

export const updateCategoryValidator = createCategoryValidator
    .partial()
    .extend({
        id: idValidator,
    });

export const deleteCategoryValidator = z.object({
    id: idValidator,
});
