import {
    isThreadBodyValid,
    isThreadTitleValid,
} from "../cammon/validators/ThreadValidators";
import { QueryArrayResult, QueryOneResult } from "./QueryArrayResult";
import { Thread } from "./Thread";
import { ThreadCategory } from "./ThreadCategory";
import { User } from "./User";

export const createThread = async (
    userId: string | undefined | null,
    categoryId: string,
    title: string,
    body: string
): Promise<QueryOneResult<Thread>> => {
    const titleMsg = isThreadTitleValid(title);
    if (titleMsg) {
        return {
            messages: [titleMsg],
        };
    }
    const bodyMsg = isThreadBodyValid(body);
    if (bodyMsg) {
        return {
            messages: [bodyMsg],
        };
    }

    if (!userId) {
        return {
            messages: ["Użytkownik nie jest zalogowany."],
        };
    }
    const user = await User.findOne({
        id: userId,
    });

    const category = await ThreadCategory.findOne({
        id: categoryId,
    });
    if (!category) {
        return {
            messages: ["Nie znaleziono kategorii."],
        };
    }
    const thread = await Thread.create({
        title,
        body,
        user,
        category,
    }).save();
    if (!thread) {
        return {
            messages: ["Nie udało się utworzyć wątku."],
        };
    }

    return {
        messages: [thread.id],
    };
};

export const getThreadById = async (
    id: string
): Promise<QueryOneResult<Thread>> => {
    const thread = await Thread.findOne({
        where: {
            id,
        },
        relations: [
            "user",
            "threadItems",
            "threadItems.user",
            "threadItems.thread",
            "category",
        ],
    });
    if (!thread) {
        return {
            messages: ["Nie udało się znaleźć wątku."],
        };
    }

    return {
        entity: thread,
    };
};

export const getThreadsByCategoryId = async (
    categoryId: string
): Promise<QueryArrayResult<Thread>> => {
    const threads = await Thread.createQueryBuilder("thread")
        .where(`thread."categoryId" = :categoryId`, { categoryId })
        .leftJoinAndSelect("thread.category", "category")
        .leftJoinAndSelect("thread.threadItems", "threadItems")
        .leftJoinAndSelect("thread.user", "user")
        .orderBy("thread.createdOn", "DESC")
        .getMany();

    if (!threads || threads.length === 0) {
        return {
            messages: ["Nie udało się znaleźć wątków w podanej kategorii."],
        };
    }

    return {
        entities: threads,
    };
};

export const getThreadsLatest = async (): Promise<QueryArrayResult<Thread>> => {
    const threads = await Thread.createQueryBuilder("thread")
        .leftJoinAndSelect("thread.category", "category")
        .leftJoinAndSelect("thread.user", "user")
        .leftJoinAndSelect("thread.threadItems", "threadItems")
        .orderBy("thread.createdOn", "DESC")
        .take(10)
        .getMany();

    if (!threads || threads.length === 0) {
        return {
            messages: ["No threads found."],
        };
    }
    console.log(threads);
    return {
        entities: threads,
    };
};
