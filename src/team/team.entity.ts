import {Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';
import {Match} from '../match/match.entity';
import {PoulePrediction} from '../poule-prediction/poule-prediction.entity';
import {Knockout} from "../knockout/knockout.entity";
import {KnockoutPrediction} from "../knockout-prediction/knockout-prediction.entity";

@Entity()
export class Team {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    name: string;

    @Column('text', {nullable: true})
    logoUrl: string;

    @Column('int', {nullable: true})
    poulePosition: number

    @Column('boolean', {default: null, nullable: true})
    isEliminated: boolean

    @Column('text', {nullable: true})
    eliminationRound: string
    
    @Column('text', {default: '32', nullable: false})
    latestActiveRound: string

    @OneToMany(type => Match, match => match.homeTeam)
    matches: Match[];

    @OneToMany(type => Knockout, knockout => knockout.homeTeam)
    knockoutsHome: Knockout[];

    @OneToMany(type => Knockout, knockout => knockout.awayTeam)
    knockoutsAway: Knockout[];

    @OneToMany(type => Knockout, knockout => knockout.winnerTeam)
    knockoutsWinner: Knockout[];

    @OneToMany(type => KnockoutPrediction, knockoutPrediction => knockoutPrediction.selectedTeam)
    knockoutsPredictions: KnockoutPrediction[];

    @OneToMany(type => KnockoutPrediction, knockoutPrediction => knockoutPrediction.homeTeam)
    knockoutsHomePredictions: KnockoutPrediction[];

    @OneToMany(type => KnockoutPrediction, knockoutPrediction => knockoutPrediction.awayTeam || knockoutPrediction.homeTeam)
    knockoutsAwayPredictions: KnockoutPrediction[];

    @OneToMany(type => PoulePrediction, poulePrediction => poulePrediction.team)
    poulePredictions: PoulePrediction[];

    @UpdateDateColumn({type: 'timestamptz'})
    updatedDate: Date;

    @CreateDateColumn({type: 'timestamptz'})
    createdDate: Date;
}
