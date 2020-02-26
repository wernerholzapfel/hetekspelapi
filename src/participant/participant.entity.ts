import {Column, Entity, Index, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {MatchPrediction} from '../match-prediction/match-prediction.entity';

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

    @OneToMany(type => MatchPrediction, matchPrediction => matchPrediction.match)
    matchPredictions: MatchPrediction[];
}
