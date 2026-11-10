import { Repository } from "typeorm";
import { Category } from "../models/category";
import { appDataSource } from "../config/data-source";
import { CreateCategoryDto, UpdateCategoryDto } from "../DTO/category-dto";

type UniqueCategory = {
    userId: number,
    slug: string
}
// TODO: Revisar todos os repositories e remover tipagens locais

export class CategoryRepository {
    private repository: Repository<Category>

    constructor() {
        this.repository = appDataSource.getRepository(Category)
    }

    async create(data: CreateCategoryDto) {
        return await this.repository.save(data)
    }

    async findByUnique({userId, slug}: UniqueCategory) {
        return await this.repository.findOne({
            where: {
                userId,
                slug
            }
        })
    }

    async loadAll(userId: number): Promise<Category[]> {
        return await this.repository.find({where: {userId}})
    }

    async loadById(id: number): Promise<Category | null> {
        return await this.repository.findOne({where: {id}})
    }

    async update(data: UpdateCategoryDto) {
        return await this.repository.save({...data})
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete({id})
    }
}