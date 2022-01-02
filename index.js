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

function removeUserLocally() {
    const userPath = path.join(process.cwd(), "user.json");
    writeFileSync(userPath, "");
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

program
    .command("list")
    .alias("ls")
    .description("List all todos.")
    .action(async () => {
        const user = getUserLocally();
        if (!user) {
            console.log("Please login first");
            return;
        }
        await connectToDb();
        const db = await client.db("cli-todo");
        const todos = db.collection("todos");
        const todosListObjArray = await todos
            .find({ user: user.username })
            .toArray();
        const todosList = todosListObjArray.map((todo) => {
            return {
                todo: todo.todo,
                isDone: todo.isDone,
                createdAt: todo.createdAt,
            };
        });

        const pendingTodos = todosList
            .filter((todo) => !todo.isDone)
            .sort((a, b) => a.createdAt - b.createdAt);

        const completedTodos = todosList
            .filter((todo) => todo.isDone)
            .sort((a, b) => b.createdAt - a.createdAt);

        if (pendingTodos.length > 0) {
            console.log("Pending todos:");
            pendingTodos.forEach((todo, index) => {
                console.log(`${index + 1} ${todo.todo}`);
            });
        } else {
            console.log("Congrats! You have no pending todos");
        }

        if (completedTodos.length > 0) {
            console.log("Completed todos:");
            completedTodos.forEach((todo, index) => {
                console.log(`${index + 1} ${todo.todo}`);
            });
        } else {
            console.log("No todo has been completed");
        }

        closeDb();
    });

program
    .command("done <index>")
    .alias("D")
    .description("Mark a todo as done.")
    .action(async (index) => {
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

        const pendingTodos = todosListObjArray
            .filter((todo) => !todo.isDone)
            .sort((a, b) => a.createdAt - b.createdAt);

        if (index > pendingTodos.length) {
            console.log("Invalid index");
            return;
        }

        const todoToBeMarkedAsDone = pendingTodos[index - 1];

        await todos.updateOne(
            { _id: todoToBeMarkedAsDone._id },
            { $set: { isDone: true } }
        );

        console.log(`${todoToBeMarkedAsDone.todo} marked as done`);

        closeDb();
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

        const validPendingFrom = ["PENDING", "pending", "P", "p"];
        const validCompletedFrom = ["COMPLETED", "completed", "C", "c"];

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

program
    .command("logout")
    .alias("lo")
    .description("Logout")
    .action(() => {
        removeUserLocally();
        console.log("Logged out");
    });

program.parse(process.argv);
