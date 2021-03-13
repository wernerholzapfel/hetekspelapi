import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
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

    @OneToMany(type => Match, match => match.homeTeam)
    matches: Match[];

    @OneToMany(type => Knockout, knockout => knockout.homeTeam || knockout.awayTeam)
    knockouts: Knockout[];

    @OneToMany(type => KnockoutPrediction, knockoutPrediction => knockoutPrediction.selectedTeam)
    knockoutsPredictions: KnockoutPrediction[];

    @OneToMany(type => PoulePrediction, poulePrediction => poulePrediction.team)
    poulePredictions: PoulePrediction[];

}

export class TeamRead extends Team {
}
