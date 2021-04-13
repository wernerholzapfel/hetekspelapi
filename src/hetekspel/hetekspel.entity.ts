import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

@Entity()
export class Hetekspel {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    currentTable: number;

    @Column()
    previousTable: number;

    @UpdateDateColumn()
    updatedDate: Date;

    @CreateDateColumn()
    createdDate: Date;
}
