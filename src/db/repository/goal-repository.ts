import { FindOptionsWhere, Repository } from "typeorm";
import { Goal } from "../models/goal";
import { appDataSource } from "../config/data-source";
import { CreateGoalDto, UpdateGoalDto } from "../DTO/goal-dto";
import { GoalPriorityEnum } from "../enum/goal-priority-enum";
import { GoalStatusEnum } from "../enum/goal-status-enum";

type UniqueGoal = {
    userId: number,
    slug: string,
}

type GoalFilters = {
    status?: GoalStatusEnum,
    priority?: GoalPriorityEnum,
}

export class GoalRepository {
    private repository: Repository<Goal>

    constructor() {
        this.repository = appDataSource.getRepository(Goal)
    }

    async create(data: CreateGoalDto): Promise<Goal> {
        return await this.repository.save(data)
    }

    async findByUnique({userId, slug}: UniqueGoal): Promise<Goal | null> {
        return await this.repository.findOne({where: {userId, slug}})
    }

    async loadAll(userId: number, filters: GoalFilters = {}): Promise<Goal[]> {
        const where: FindOptionsWhere<Goal> = {userId, ...filters}

        return await this.repository.find({
            where,
            order: {
                status: "ASC",
                priority: "DESC",
                deadline: {direction: "ASC", nulls: "LAST"},
                createdAt: "ASC",
            },
        })
    }

    async loadById(id: number): Promise<Goal | null> {
        return await this.repository.findOne({where: {id}})
    }

    async update(data: UpdateGoalDto): Promise<Goal> {
        return await this.repository.save({...data})
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete({id})
    }
}
