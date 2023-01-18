import { getManager } from "typeorm";
import { Thread } from "./Thread";
import { ThreadPoint } from "./ThreadPoints";
import { User } from "./User";

export const updateThreadPoint = async (
    userId: string,
    threadId: string,
    increment: boolean
): Promise<string> => {
    if (!userId || userId === "0") return "User is not authenticated";
    let message = "Nie udało się inkrementować liczby punktów wątku";
    const thread = await Thread.findOne({
        where: { id: threadId },
        relations: ["user"],
    });

    if (thread!.user!.id === userId) {
        message = "Błąd. Użytkownik nie może oceniać swojego wątku.";
        console.log("incThreadPoints", message);
        return message;
    }
    const user = await User.findOne({
        where: { id: userId },
    });
    const existingPoint = await ThreadPoint.findOne({
        where: {
            thread: { id: threadId },
            user: { id: userId },
        },
        relations: ["thread"],
    });
    await getManager().transaction(async (transationEntityManager) => {
        if (existingPoint) {
            if (increment) {
                if (existingPoint.isDecrement) {
                    await ThreadPoint.remove(existingPoint);
                    thread!.points = Number(thread!.points) + 1;
                    thread!.lastModifiedOn = new Date();
                    await thread!.save();
                }
            } else {
                if (!existingPoint.isDecrement) {
                    await ThreadPoint.remove(existingPoint);
                    thread!.points = Number(thread!.points) - 1;
                    thread!.lastModifiedOn = new Date();
                    await thread!.save();
                }
            }
        } else {
            await ThreadPoint.create({
                thread,
                isDecrement: !increment,
                user,
            }).save();
            if (increment) {
                thread!.points = Number(thread!.points) + 1;
            } else {
                thread!.points = Number(thread!.points) - 1;
            }
            thread!.lastModifiedOn = new Date();
            await thread!.save();
        }
        message = `Pomyślnie ${increment ? "dodano" : "odjęto"} punkt.`;
    });
    return message;
};
