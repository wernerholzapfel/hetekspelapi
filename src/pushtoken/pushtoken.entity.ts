import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Participant} from "../participant/participant.entity";

@Entity()
@Index(['pushToken', 'participant'], {unique: true})
export class Pushtoken {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({select: false})
    pushToken: string;

    @ManyToOne(type => Participant, participant => participant.matchPredictions, {nullable: false})
    participant: Participant;


    @UpdateDateColumn()
    updatedDate: Date;

    @CreateDateColumn()
    createdDate: Date;
}
