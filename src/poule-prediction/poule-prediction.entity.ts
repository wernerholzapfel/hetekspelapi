import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';
import {Participant} from '../participant/participant.entity';
import {Team} from '../team/team.entity';

@Entity()
export class PoulePrediction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({nullable: false})
    position: number;

    @Column({nullable: true})
    poule: string;

    @Column({nullable: false})
    thirdPositionScore: number;

    @Column({nullable: true})
    punten: number;

    @Column({nullable: true})
    goalsFor: number;

    @Column({nullable: true})
    goalsAgainst: number;

    @Column({nullable: true})
    winst: number;

    @Column({nullable: true})
    positie: number;

    @Column({nullable: true})
    gespeeld: number;

    @ManyToOne(type => Team, team => team.poulePredictions, {nullable: false})
    team: Team;

    @ManyToOne(type => Participant, participant => participant.matchPredictions, {nullable: false})
    participant: Participant;

    @UpdateDateColumn()
    updatedDate: Date;

    @CreateDateColumn()
    createdDate: Date;
}