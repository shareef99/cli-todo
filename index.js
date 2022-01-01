#! /usr/bin/env node

import { program } from "commander";

program.version("0.0.1");

import { MongoClient } from "mongodb";

const uri =
    "mongodb+srv://shareef:shareef1981A@cluster0.bslsb.mongodb.net/cli-todo?retryWrites=true&w=majority";

const [, , ...data] = process.argv;

if (data.length === 0) {
    console.log(`Welcome to CLI-Todo for linux lovers!`);
}

if (data) {
    const [command, ...args] = data;
    if (command === "help") {
        console.log(`Welcome to the help section of CLI-Todo for linux lovers!
Commands:
    todo add: Adds a task to the list
    todo ls: Lists all the tasks
    todo del: Deletes a task from the list
    todo help: Displays the help menu`);
    }

    let client;

    async function connectToDb() {
        try {
            client = await MongoClient.connect(uri);
        } catch (err) {
            console.log(`Couldn't connect to database`, err);
        }
    }

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
    }

    if (command === "add") {
        connectToDb().then(() => {
            const [todo] = args;
            const db = client.db("cli-todo");
            db.collection("todos")
                .insertOne({ todo, completed: false })
                .then(() => {
                    console.log(`Added ${todo} to your list of tasks`);
                    client.close();
                });
        });
    }

    if (command === "del") {
        connectToDb().then(() => {
            const [index] = args;
            const db = client.db("cli-todo");
            db.collection("todos")
                .findOneAndDelete({ _id: index })
                .then((result) => {
                    if (result.value) {
                        console.log(
                            `Deleted ${result.value.todo} from your list of tasks`
                        );
                    } else {
                        console.log(`Couldn't find task with id ${index}`);
                    }
                    client.close();
                });
        });
    }
}

program.parse(process.argv);
