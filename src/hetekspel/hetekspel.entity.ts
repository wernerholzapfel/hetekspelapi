import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

@Entity()
export class Hetekspel {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    currentTable: number;

    @Column()
    previousTable: number;

    @UpdateDateColumn({type: 'timestamptz'})
    deadline: Date;

    @UpdateDateColumn({type: 'timestamptz'})
    updatedDate: Date;

    @CreateDateColumn({type: 'timestamptz'})
    createdDate: Date;
}
