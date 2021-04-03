import {Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';
import {Participant} from '../participant/participant.entity';
import {Knockout} from "../knockout/knockout.entity";
import {Team} from "../team/team.entity";

@Entity()
@Index(['participant', 'knockout'], {unique: true})
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

    @ManyToOne(type => Participant, participant => participant.knockoutPredictions, {nullable: false})
    participant: Participant;

    @UpdateDateColumn()
    updatedDate: Date;

    @CreateDateColumn()
    createdDate: Date;
}
