import {Users} from "../models/users";
import {appDataSource} from "../config/data-source";
import {EntityManager, Repository} from "typeorm";
import {CreateUsersDto} from "../DTO/users-dto";

export class UsersRepository {
    private repository: Repository<Users>;

    constructor(manager: EntityManager = appDataSource.manager) {
        this.repository = manager.getRepository(Users);
    }

    async create(data: CreateUsersDto): Promise<Users> {
        return await this.repository.save(data);
    }

    async loadByEmail(email: string): Promise<Users | null> {
        return await this.repository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .getOne();
    }

    async loadById(id: number | undefined): Promise<Users | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async updateProfilePicture(id: number, profilePicture: string | null): Promise<void> {
        await this.repository.update({ id }, { profilePicture });
    }
}