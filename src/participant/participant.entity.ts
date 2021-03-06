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
import {PoulePrediction} from "../poule-prediction/poule-prediction.entity";
import {Pushtoken} from "../pushtoken/pushtoken.entity";

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

    @OneToMany(type => Pushtoken, pushtoken => pushtoken.participant)
    pushTokens: Pushtoken[];

    @OneToMany(type => MatchPrediction, matchPrediction => matchPrediction.participant)
    matchPredictions: MatchPrediction[];

    @OneToMany(type => KnockoutPrediction, knockoutPrediction => knockoutPrediction.participant)
    knockoutPredictions: KnockoutPrediction[];

    @OneToMany(type => PoulePrediction, poulePrediction => poulePrediction.participant)
    poulePredictions: PoulePrediction[];

    @UpdateDateColumn({type: 'timestamptz'})
    updatedDate: Date;

    @CreateDateColumn({type: 'timestamptz'})
    createdDate: Date;

    @Column({default: true})
    isAllowed: boolean;

    @Column({default: false, select: false})
    hasPaid: boolean;
}
