import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Match} from '../match/match.entity';

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

}

export class TeamRead extends Team {
}
