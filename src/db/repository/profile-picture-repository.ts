import { EntityManager, Repository } from "typeorm";
import { ProfilePicture } from "../models/profile-picture";
import { appDataSource } from "../config/data-source";
import { CreateProfilePictureDto } from "../DTO/profile-picture-dto";

export class ProfilePictureRepository {
    private repository: Repository<ProfilePicture>

    constructor(manager: EntityManager = appDataSource.manager) {
        this.repository = manager.getRepository(ProfilePicture)
    }

    // ON CONFLICT (user_id): se o usuário já tem foto, a linha é sobrescrita inclusive o id
    async upsert(data: CreateProfilePictureDto): Promise<void> {
        await this.repository.upsert(data, ["userId"])
    }

    async loadById(id: string): Promise<ProfilePicture | null> {
        return await this.repository.findOne({
            where: {id}
        })
    }

    async deleteByUserId(userId: number): Promise<void> {
        await this.repository.delete({userId})
    }
}
