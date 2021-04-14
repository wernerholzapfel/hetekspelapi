import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import {Team} from '../team/team.entity';
import {KnockoutPrediction} from "../knockout-prediction/knockout-prediction.entity";

@Entity()
export class Knockout {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    ordering: number;

    @Column()
    matchId: string;

    @Column()
    homeId: string;

    @Column()
    awayId: string;

    @Column()
    city: string;

    @Column()
    round: string;

    @Column({nullable: true})
    homeScore: number;

    @Column({nullable: true})
    awayScore: number;

    @Column({nullable: true, type: 'timestamp'})
    date: Date;

    @OneToMany(type => KnockoutPrediction, knockoutPrediction => knockoutPrediction.knockout)
    knockoutPredictions: KnockoutPrediction[];

    @ManyToOne(type => Team, team => team.matches) // todo fix this
    homeTeam: Team;

    @ManyToOne(type => Team, team => team.matches) // todo fix this
    awayTeam: Team;

    @ManyToOne(type => Team, team => team.matches) // todo fix this
    winnerTeam: Team;

    @UpdateDateColumn({type: 'timestamptz'})
    updatedDate: Date;

    @CreateDateColumn({type: 'timestamptz'})
    createdDate: Date;
}
