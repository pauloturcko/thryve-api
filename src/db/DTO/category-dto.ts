import { CategoryTypeEnum } from "../enum/category-type-enum";

export interface CreateCategoryDto {
    userId: number;
    name: string;
    slug: string;
    icon: string;
    color: string;
    type: CategoryTypeEnum;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto> & {
    id: number
}