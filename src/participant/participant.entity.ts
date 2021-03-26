import {
    Column, CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import {MatchPrediction} from '../match-prediction/match-prediction.entity';
import {KnockoutPrediction} from "../knockout-prediction/knockout-prediction.entity";

@Entity()
@Index(['firebaseIdentifier'], {unique: true})
export class Participant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    displayName: string;

    @Column({select: false})
    email: string;

    @Column({select: false})
    firebaseIdentifier: string;

    @OneToMany(type => MatchPrediction, matchPrediction => matchPrediction.participant)
    matchPredictions: MatchPrediction[];

    @OneToMany(type => KnockoutPrediction, knockoutPrediction => knockoutPrediction.participant)
    knockoutPredictions: KnockoutPrediction[];

    @UpdateDateColumn()
    updatedDate: Date;

    @CreateDateColumn()
    createdDate: Date;
}
