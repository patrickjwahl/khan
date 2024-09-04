import { test, expect } from '@playwright/test';
import resetDb from './helpers/reset-db';
import { sessionOptions } from '@/lib/session';
import { User } from '@/lib/user';
import { sealData } from 'iron-session';
import { PrismaClient, QuestionType } from '@prisma/client';

test.beforeAll(async () => {
    await resetDb();

    const myId = (await prisma.user.create({
        data: {
            email: 'my@my.com',
            password: 'ssdfj',
            username: 'me',
            canEdit: true
        }
    })).id

    const ownerId = (await prisma.user.create({
        data: {
            email: 'dummy@dummy.com',
            password: 'dummy',
            username: 'owner',
            canEdit: true
        }
    })).id

    const courseId = (await prisma.course.create({
        data: {
            language: "Mongolian",
            ownerId,
            published: true
        }
    })).id

    const moduleId = (await prisma.module.create({
        data: {
            courseId,
            title: "Intro",
            index: 0,
            published: true,
        }
    })).id

    const lessonId = (await prisma.lesson.create({
        data: {
            moduleId,
            title: "Hello World",
            index: 0
        }
    })).id

    const backwardQuestionId = (await prisma.question.create({
        data: {
            type: QuestionType.QUESTION,
            native: 'How are you?',
            target: 'Сайн байна уу?',
            lessonId,
            moduleId,
            index: 0,
            forwardEnabled: false
        }
    })).id

    const forwardQuestionId = (await prisma.question.create({
        data: {
            type: QuestionType.QUESTION,
            native: 'How are you?',
            target: 'Сайн байна уу?',
            lessonId,
            moduleId,
            index: 1,
            backwardEnabled: false
        }
    })).id

    await prisma.userCourse.create({
        data: {
            userId: myId,
            courseId,
            lessonId,
            moduleId
        }
    })

    await prisma.wordHint.create({
        data: {
            forwardQuestionId,
            wordString: "Сайн",
            index: 0
        }
    })

    await prisma.wordHint.create({
        data: {
            forwardQuestionId,
            wordString: "байна",
            index: 1
        }
    })

    await prisma.wordHint.create({
        data: {
            forwardQuestionId,
            wordString: "уу?",
            index: 2
        }
    })

    await prisma.wordHint.create({
        data: {
            backwardQuestionId,
            wordString: "How",
            index: 0
        }
    })

    await prisma.wordHint.create({
        data: {
            backwardQuestionId,
            wordString: "are",
            index: 1
        }
    })

    await prisma.wordHint.create({
        data: {
            backwardQuestionId,
            wordString: "you?",
            index: 2
        }
    })
});

const prisma = new PrismaClient();

test('try question', async ({ page, context }) => {

    const myUser = await prisma.user.findFirst({
        where: {
            username: 'me'
        }
    })

    const myLesson = await prisma.lesson.findFirst()

    expect(myUser).toBeTruthy();
    expect(myLesson?.id).toBeTruthy();

    const testUser: User = {
        isLoggedIn: true,
        email: 'test@gmail.com',
        id: myUser?.id || 0,
        username: 'testy',
        canEdit: true
    }

    await context.addCookies([
        { 
            name: sessionOptions.cookieName,
            value: await sealData({user: testUser}, { password: sessionOptions.password }),
            url: 'http://localhost:3001'
        }
    ])

    await page.goto(`http://localhost:3001/`);
    await expect(page).toHaveTitle('Genghis Khan Academy | Learn a language. Build an empire.');

    await page.goto(`http://localhost:3001/learn/lesson/${myLesson?.id}`)
    await expect(page.getByTestId('questionword').first()).toHaveText('Сайн', { ignoreCase: true });

    await page.getByPlaceholder('Type your answer').first().fill('How are you');
    await page.getByText('submit').click();
    await expect(page.getByTestId('result').first()).toHaveText("Great job!", { ignoreCase: true });

    await page.getByText('Next question').first().click();
    await expect(page.getByTestId('questionword').first()).toHaveText('How', { ignoreCase: true });
})