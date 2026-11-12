import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Users } from "./users";

// Os bytes da imagem ficam numa tabela própria (e não na users) pra que o loadById do authMiddleware, que roda a cada request, não carregue a imagem junto.
// O @OneToOne cria a constraint UNIQUE em user_id
@Entity("profile_pictures")
export class ProfilePicture {

    // UUID gerado a cada upload: entra na URL pública da imagem, então não pode ser sequencial
    @PrimaryColumn({type: "uuid"})
    id: string;

    @Column({name: "user_id", type: "int"})
    userId: number;

    @Column({name: "content_type", type: "varchar", length: 50})
    contentType: string;

    @Column({type: "bytea"})
    data: Buffer;

    @CreateDateColumn({name: "created_at", type: "timestamp"})
    createdAt: Date;

    @OneToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    user: Users;
}
