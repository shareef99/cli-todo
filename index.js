#! /usr/bin/env node

const { program } = require("commander");
const { prompt } = require("inquirer");
const { writeFileSync, readFileSync } = require("fs");
const path = require("path");

program.version("0.0.1");

const { MongoClient } = require("mongodb");

const uri =
    "mongodb+srv://shareef:shareef1981A@cluster0.bslsb.mongodb.net/cli-todo?retryWrites=true&w=majority";

let client;

async function connectToDb() {
    try {
        client = await MongoClient.connect(uri);
    } catch (err) {
        console.log(`Couldn't connect to database`, err);
    }
}

async function closeDb() {
    try {
        await client.close();
    } catch (err) {
        console.log(`Couldn't close database`, err);
    }
}

function setUserLocally(user) {
    const userPath = path.join(process.cwd(), "user.json");
    writeFileSync(userPath, JSON.stringify(user));
}

function getUserLocally() {
    const userPath = path.join(process.cwd(), "user.json");
    return JSON.parse(readFileSync(userPath));
}

program
    .command("login")
    .alias("--l")
    .description("Login with username and password.")
    .action(async () => {
        const question = {
            type: "input",
            name: "isNewUser",
            message: "Do you have account(y/n)",
        };

        prompt(question).then(async ({ isNewUser }) => {
            if (isNewUser === "n") {
                console.log(
                    "Enter username and password to create new account."
                );
                const questions = [
                    {
                        type: "input",
                        name: "username",
                        message: "Enter username",
                    },
                    {
                        type: "password",
                        name: "password",
                        message: "Enter password",
                    },
                ];

                prompt(questions)
                    .then(async ({ username, password }) => {
                        await connectToDb();
                        const db = await client.db("cli-todo");
                        const users = db.collection("users");
                        const user = await users.findOne({ username });

                        if (user) {
                            console.log("User already exists");
                        } else {
                            const user = {
                                username,
                                password,
                            };
                            setUserLocally(user);
                            await users.insertOne(user);
                            console.log("User created");
                        }
                    })
                    .then(closeDb);
            } else if (isNewUser === "y") {
                console.log("Enter username and password to login.");
                const questions = [
                    {
                        type: "input",
                        name: "username",
                        message: "Enter username",
                    },
                    {
                        type: "password",
                        name: "password",
                        message: "Enter password",
                    },
                ];

                prompt(questions)
                    .then(async ({ username, password }) => {
                        await connectToDb();
                        const db = await client.db("cli-todo");
                        const users = db.collection("users");
                        const user = await users.findOne({ username });

                        if (user) {
                            if (user.password === password) {
                                console.log("Login successful");
                                setUserLocally(user);
                            } else {
                                console.log("Wrong password");
                                const question = {
                                    type: "input",
                                    name: "password",
                                    message: "Enter password again",
                                };
                                prompt(question).then(async ({ password }) => {
                                    if (user.password === password) {
                                        console.log("Login successful");
                                        setUserLocally(user);
                                    } else {
                                        console.log("Wrong password again");
                                    }
                                });
                            }
                        } else {
                            console.log("User doesn't exist");
                        }
                    })
                    .then(closeDb);
            } else {
                console.log("Wrong input");
            }
        });
    });

program
    .command("add <todo>")
    .alias("+")
    .description("Add a new todo.")
    .action(async (todo) => {
        const user = getUserLocally();
        if (!user) {
            console.log("Please login first");
            return;
        }
        await connectToDb();
        const db = await client.db("cli-todo");
        const todos = db.collection("todos");
        const newTodo = {
            todo,
            user: user.username,
            isDone: false,
            createdAt: new Date(),
        };
        await todos.insertOne(newTodo);
        console.log(`${todo} added`);
        closeDb();
    });

const [command, ...args] = data;

if (command === "ls") {
    connectToDb().then(() => {
        const db = client.db("cli-todo");
        db.collection("todos")
            .find({})
            .toArray()
            .then((docs) => {
                const todos = docs;
                let pendingTodos = todos.filter((todo) => !todo.completed);
                let completedTodos = todos.filter((todo) => todo.completed);
                console.log("List of your tasks");
                console.log(`pending tasks ${pendingTodos.length} `);
                pendingTodos.forEach((todo, index) => {
                    console.log(`${index + 1}. ${todo.todo}`);
                });
                console.log(`completed tasks ${completedTodos.length}`);
                completedTodos.forEach((todo, index) => {
                    console.log(`${index + 1}. ${todo.todo}`);
                });
                client.close();
            });
    });

program
    .command("delete <from> <index>")
    .alias("del")
    .description("Delete a todo.")
    .action(async (from, index) => {
        const user = getUserLocally();
        if (!user) {
            console.log("Please login first");
            return;
        }

        if (index < 1) {
            console.log("Invalid index");
            return;
        }

        await connectToDb();
        const db = await client.db("cli-todo");
        const todos = db.collection("todos");
        const todosListObjArray = await todos
            .find({ user: user.username })
            .toArray();

        const validPendingFrom = [
            "PENDING",
            "pending",
            "P",
            "p",
            "--PENDING",
            "--pending",
            "--p",
            "--P",
        ];
        const validCompletedFrom = [
            "COMPLETED",
            "completed",
            "C",
            "c",
            "--COMPLETED",
            "--completed",
            "--c",
            "--C",
        ];

        if (validPendingFrom.includes(from)) {
            const pendingTodos = todosListObjArray
                .filter((todo) => !todo.isDone)
                .sort((a, b) => a.createdAt - b.createdAt);

            if (index > pendingTodos.length) {
                console.log("Invalid index");
                return;
            }

            const todoToBeDeleted = pendingTodos[index - 1];

            await todos.deleteOne({ _id: todoToBeDeleted._id });

            console.log(`${todoToBeDeleted.todo} deleted`);
        } else if (validCompletedFrom.includes(from)) {
            const completedTodos = todosListObjArray
                .filter((todo) => todo.isDone)
                .sort((a, b) => b.createdAt - a.createdAt);

            if (index > completedTodos.length) {
                console.log("Invalid index");
                return;
            }

            const todoToBeDeleted = completedTodos[index - 1];

            await todos.deleteOne({ _id: todoToBeDeleted._id });

            console.log(`${todoToBeDeleted.todo} deleted`);
        } else {
            console.log("Invalid command");
        }

        closeDb();
    });

program.parse(process.argv);
