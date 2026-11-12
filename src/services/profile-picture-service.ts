import { randomUUID } from "crypto";
import { appDataSource } from "../db/config/data-source";
import { ProfilePicture } from "../db/models/profile-picture";
import { ProfilePictureRepository } from "../db/repository/profile-picture-repository";
import { UsersRepository } from "../db/repository/users-repository";
import { BusinessRuleError, NotFoundError } from "../errors";
import { PROFILE_PICTURE_CONTENT_TYPE, processProfilePicture } from "../utils/process-profile-picture";
import { profilePictureIdValidator, uploadProfilePictureValidator } from "./validators/profile-picture-validator";

export class ProfilePictureService {
    private profilePictureRepository: ProfilePictureRepository

    constructor() {
        this.profilePictureRepository = new ProfilePictureRepository()
    }

    // Devolve a URL nova da foto, a mesma que passa a vir em user.profilePicture no login e no /me.
    async upload(userId: number, file: unknown): Promise<string> {
        const {buffer} = uploadProfilePictureValidator.parse(file)

        const picture = await processProfilePicture(buffer)
        if (!picture) {
            throw new BusinessRuleError("Envie uma imagem válida em JPG, PNG ou WebP.")
        }

        const id = randomUUID()
        const profilePicture = `/profile-picture/${id}`
        await appDataSource.transaction(async (manager) => {
            const profilePictureRepository = new ProfilePictureRepository(manager)
            const usersRepository = new UsersRepository(manager)

            await profilePictureRepository.upsert({id, userId, contentType: PROFILE_PICTURE_CONTENT_TYPE, data: picture})
            await usersRepository.updateProfilePicture(userId, profilePicture)
        })

        return profilePicture
    }

    async remove(userId: number): Promise<void> {
        await appDataSource.transaction(async (manager) => {
            const profilePictureRepository = new ProfilePictureRepository(manager)
            const usersRepository = new UsersRepository(manager)

            await profilePictureRepository.deleteByUserId(userId)
            await usersRepository.updateProfilePicture(userId, null)
        })
    }

    async load(data: unknown): Promise<ProfilePicture> {
        const {id} = profilePictureIdValidator.parse(data)

        const picture = await this.profilePictureRepository.loadById(id)
        if (!picture) {
            throw new NotFoundError("Profile picture not found")
        }

        return picture
    }
}
