import { GoalPriorityEnum } from "../enum/goal-priority-enum";
import { GoalStatusEnum } from "../enum/goal-status-enum";

export interface CreateGoalDto {
    userId: number;
    name: string;
    slug: string;
    targetAmount: string | null;
    savedAmount: string;
    priority: GoalPriorityEnum;
    status: GoalStatusEnum;
    deadline: string | null;
    completedAt: string | null;
    notes: string | null;
}

export type UpdateGoalDto = Partial<CreateGoalDto> & {
    id: number;
}
