import {Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn} from 'typeorm';
import {Participant} from '../participant/participant.entity';
import {Knockout} from "../knockout/knockout.entity";
import {Team} from "../team/team.entity";

@Entity()
@Index(['participant', 'knockout'], {unique: true})
@Unique(['participant', 'selectedTeam', 'round'])
export class KnockoutPrediction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(type => Knockout, knockout => knockout.knockoutPredictions, {nullable: false})
    knockout: Knockout;

    @ManyToOne(type => Team, team => team.knockoutsPredictions)
    selectedTeam: Team;

    @ManyToOne(type => Team, team => team.knockoutsPredictions)
    homeTeam: Team;

    @Column({default: false})
    homeInRound: boolean

    @Column({default: false})
    awayInRound: boolean

    @ManyToOne(type => Team, team => team.knockoutsPredictions)
    awayTeam: Team;

    @Column({nullable: true})
    homeSpelpunten: number;

    @Column({nullable: true})
    awaySpelpunten: number;

    @Column({nullable: true})
    winnerSpelpunten: number;
    
    @Column({nullable: true})
    homeTableId: number;

    @Column({nullable: true})
    awayTableId: number;

    @Column({nullable: true})
    winnerTableId: number;
    
    @Column({nullable: true})
    round: string;

    @ManyToOne(type => Participant, participant => participant.knockoutPredictions, {nullable: false})
    participant: Participant;

    @UpdateDateColumn({type: 'timestamptz'})
    updatedDate: Date;

    @CreateDateColumn({type: 'timestamptz'})
    createdDate: Date;
}
