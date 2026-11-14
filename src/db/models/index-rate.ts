import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";
import { IndexTypeEnum } from "../enum/index-type-enum";

@Entity("index_rates")
@Unique("UQ_index_rates_index_date", ["indexType", "date"])
export class IndexRate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: "index_type", type: "int"})
    indexType: IndexTypeEnum;

    @Column({type: "date"})
    date: string;

    @Column({type: "numeric", precision: 10, scale: 6})
    rate: string;
}
