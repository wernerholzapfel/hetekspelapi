import {Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';
import {Participant} from '../participant/participant.entity';
import {Match} from '../match/match.entity';

@Entity()
@Index(['participant', 'match'], {unique: true})
export class MatchPrediction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(type => Match, match => match.matchPredictions, {nullable: false})
    match: Match;

    @Column({nullable: true})
    homeScore: number;

    @Column({nullable: true})
    awayScore: number;

    @Column({nullable: true})
    spelpunten: number;

    @ManyToOne(type => Participant, participant => participant.matchPredictions, {nullable: false})
    participant: Participant;

    @UpdateDateColumn({type: 'timestamptz'})
    updatedDate: Date;

    @CreateDateColumn({type: 'timestamptz'})
    createdDate: Date;
}
