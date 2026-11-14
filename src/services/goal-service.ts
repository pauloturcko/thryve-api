import { Goal } from "../db/models/goal";
import { GoalStatusEnum } from "../db/enum/goal-status-enum";
import { GoalRepository } from "../db/repository/goal-repository";
import { ErrorCode, ForbiddenError, GenericError, NotFoundError } from "../errors";
import { toDateString } from "../utils/date";
import { slugify } from "../utils/slugify";
import {
    createGoalValidator,
    deleteGoalValidator,
    listGoalsValidator,
    updateGoalValidator,
} from "./validators/goal-validator";

const resolveCompletedAt = (status: GoalStatusEnum, current?: Pick<Goal, "status" | "completedAt">) => {
    if (status !== GoalStatusEnum.completed) return null;
    if (current?.status === GoalStatusEnum.completed && current.completedAt) return current.completedAt;
    return toDateString(new Date());
};

export class GoalService {
    private goalRepository = new GoalRepository();

    async create(userId: number, data: unknown): Promise<Goal> {
        const parsed = createGoalValidator.parse(data);
        const slug = slugify(parsed.name);

        await this.ensureUniqueName(userId, slug);

        return await this.goalRepository.create({
            userId,
            name: parsed.name,
            slug,
            targetAmount: parsed.targetAmount ?? null,
            savedAmount: parsed.savedAmount,
            priority: parsed.priority,
            status: parsed.status,
            deadline: parsed.deadline ?? null,
            completedAt: resolveCompletedAt(parsed.status),
            notes: parsed.notes ?? null,
        });
    }

    async loadAll(userId: number, query: unknown): Promise<Goal[]> {
        const filters = listGoalsValidator.parse(query);

        return await this.goalRepository.loadAll(userId, filters);
    }

    async update(userId: number, data: unknown): Promise<Goal> {
        const parsed = updateGoalValidator.parse(data);
        const goal = await this.loadOwnedGoal(userId, parsed.id);

        const slug = slugify(parsed.name ?? goal.name);
        await this.ensureUniqueName(userId, slug, goal.id);

        const status = parsed.status ?? goal.status;

        return await this.goalRepository.update({
            ...goal,
            ...parsed,
            slug,
            completedAt: resolveCompletedAt(status, goal),
        });
    }

    async delete(userId: number, data: unknown): Promise<void> {
        const {id} = deleteGoalValidator.parse(data);
        await this.loadOwnedGoal(userId, id);

        await this.goalRepository.delete(id);
    }

    private async loadOwnedGoal(userId: number, id: number): Promise<Goal> {
        const goal = await this.goalRepository.loadById(id);
        if (!goal) throw new NotFoundError(ErrorCode.goalNotFound, "Goal does not exist!");
        if (goal.userId !== userId) throw new ForbiddenError();

        return goal;
    }

    private async ensureUniqueName(userId: number, slug: string, currentId?: number): Promise<void> {
        const existing = await this.goalRepository.findByUnique({userId, slug});
        if (existing && existing.id !== currentId) {
            throw new GenericError(ErrorCode.goalAlreadyExists, "This goal already exists!");
        }
    }
}
