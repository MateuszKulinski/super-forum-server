import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Auditable } from "./Auditable";
import { Thread } from "./Thread";
import { User } from "./User";

@Entity({ name: "ThreadPoints" })
export class ThreadPoint extends Auditable {
    @PrimaryGeneratedColumn({ name: "Id", type: "bigint" })
    id: string;

    @Column("boolean", { name: "isDecrement", default: false, nullable: false })
    isDecrement: boolean;

    @ManyToOne(() => User, (user) => user.threadPoints)
    user: User;

    @ManyToOne(() => Thread, (thread) => thread.threadPoints)
    thread: Thread;
}
