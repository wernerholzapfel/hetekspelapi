import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {MatchPrediction} from '../match-prediction/match-prediction.entity';
import {Team} from '../team/team.entity';

@Entity()
export class Match {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    ordering: number;

    @Column()
    poule: string;

    @Column()
    city: string;

    @Column({nullable: true})
    homeScore: number;

    @Column({nullable: true})
    awayScore: number;

    @Column({nullable: true, type: 'timestamp'})
    date: Date;

    @OneToMany(type => MatchPrediction, matchPrediction => matchPrediction.match)
    matchPredictions: MatchPrediction[];

    @ManyToOne(type => Team, team => team.matches)
    homeTeam: Team;

    @ManyToOne(type => Team, team => team.matches)
    awayTeam: Team;
}
