#! /usr/bin/env node
// We are writing the above to make sure that this file is run as a script
// without specifying the node command.

const { MongoClient } = require("mongodb");

const uri =
    "mongodb+srv://shareef:shareef1981A@cluster0.bslsb.mongodb.net/cli-todo?retryWrites=true&w=majority";

const [, , ...data] = process.argv;

if (data.length === 0) {
    console.log(`Welcome to CLI-Todo for linux lovers!`);
    return;
}

const listHandler = async () => {
    const db = client.db();
    console.log(db);
};

if (data) {
    const [command, ...args] = data;
    if (command === "help") {
        console.log(`Welcome to the help section of CLI-Todo for linux lovers!
Commands:
    todo add: Adds a task to the list
    todo ls: Lists all the tasks
    todo del: Deletes a task from the list
    todo help: Displays the help menu`);
        return;
    }
    if (command === "ls") {
        let client;
        async function listHandler() {
            try {
                client = await MongoClient.connect(uri);
            } catch (err) {
                console.log(`Couldn't connect to database`, err);
            }
        }

        listHandler().then(() => {
            const db = client.db("cli-todo");
            db.collection("todos")
                .find({})
                .toArray()
                .then((docs) => {
                    console.log(docs);
                    client.close();
                });
            console.log("List of your tasks");
            console.log("Pending:");
            console.log("Completed:");
        });

        return;
    }
}
