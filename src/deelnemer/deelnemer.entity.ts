import {Column, Entity, Index, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
@Index(['firebaseIdentifier'], {unique: true})
export class Deelnemer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    displayName: string;

    @Column({select: false})
    email: string;

    @Column({select: false})
    firebaseIdentifier: string;

}
