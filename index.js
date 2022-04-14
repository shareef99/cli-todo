#! /usr/bin/env node

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { prompt } = require("inquirer");
import { program } from "commander";
import chalk from "chalk";
import {
  filePath,
  getTasks,
  addTasks,
  displayPendingTasks,
  displayCompletedTasks,
  getPendingTasks,
  getTasksByType,
  displayAllTasks,
} from "./helpers.js";

program
  .name("task-tracker")
  .description("A simple CLI tool for keeping track of your tasks")
  .version("0.0.1");

program
  .command("add [task]")
  .alias("+")
  .description("Add a new task")
  .action((task) => {
    let tasks = getTasks();
    const id = Math.floor(Math.random() * 1000000 + 1);
    const completed = false;

    if (!task) {
      prompt({
        type: "input",
        name: "task",
        message: `${chalk.blue("What's your task:-")}`,
      }).then((answers) => {
        const { task } = answers;
        tasks.push({
          id,
          task,
          completed,
        });
        addTasks(tasks);
        console.log(chalk.green(`${task} added`));
      });
      return;
    }

    tasks.push({
      id,
      task,
      completed,
    });
    addTasks(tasks);
    console.log(chalk.green(`${task} added`));
  });

program
  .command("list")
  .alias("ls")
  .description("List the tasks")
  .action(() => {
    prompt({
      type: "input",
      name: "filter",
      message: `${chalk.magenta(
        "Filter by(Pending tasks(P), Completed(C) and All tasks(A)):-"
      )}`,
    }).then((answers) => {
      let { filter } = answers;
      if (filter.toUpperCase() === "A") {
        console.log(chalk.bold.blue("All tasks:-"));
        displayPendingTasks();
        displayCompletedTasks();
      } else if (filter.toUpperCase() === "P") {
        displayPendingTasks();
      } else if (filter.toUpperCase() === "C") {
        displayCompletedTasks();
      } else {
        console.log(chalk.red("Invalid filter option"));
      }
    });
  });

program
  .command("complete")
  .aliases(["done", "finish"])
  .description("Mark a task as completed")
  .action(() => {
    displayPendingTasks();
    prompt({
      type: "input",
      name: "index",
      message: `${chalk.magenta(
        "Enter the index of the task to be marked as completed:-"
      )}`,
    }).then((answers) => {
      const { index } = answers;
      const numberOfTasks = getPendingTasks().length;
      if (+index < 0 || +index > numberOfTasks || isNaN(index)) {
        console.log(chalk.red("\nPlease enter proper index value."));
      } else {
        console.log(+index);
        let tasks = getTasks();
        tasks[index - 1].completed = true;
        addTasks(tasks);
        console.log(
          chalk.green(
            `"${chalk.blue(tasks[index - 1].task)}" marked as completed`
          )
        );
      }
    });
  });

program
  .command("delete")
  .alias("del")
  .description("Delete a task")
  .action(() => {
    let taskType;
    prompt({
      type: "input",
      name: "filter",
      message: `${chalk.magenta(
        "Filter by(Pending tasks(P), Completed(C) and All tasks(A)):-"
      )}`,
    }).then((answers) => {
      let { filter } = answers;
      if (filter.toUpperCase() === "A") {
        taskType = "A";
        console.log(chalk.bold.blue("All tasks:-"));
        displayAllTasks();
      } else if (filter.toUpperCase() === "P") {
        taskType = "P";
        displayPendingTasks();
      } else if (filter.toUpperCase() === "C") {
        taskType = "C";
        displayCompletedTasks();
      } else {
        console.log(chalk.red("\nPlease enter proper filter value."));
        return;
      }

      prompt({
        type: "input",
        name: "index",
        message: `${chalk.magenta(
          "Enter the index of the task to be deleted:-"
        )}`,
      }).then((answers) => {
        const { index } = answers;
        const numberOfTasks = getTasksByType(taskType).length;
        if (+index < 0 || +index > numberOfTasks || isNaN(index)) {
          console.log(chalk.red("\nPlease enter proper index value."));
        } else {
          let tasks = getTasksByType(taskType);
          const newTasks = tasks.filter(
            (task) => task.id !== tasks[index - 1].id
          );
          if (taskType === "A") {
            addTasks(newTasks);
          } else if (taskType === "P") {
            const completedTasks = getTasksByType("C");
            addTasks(completedTasks.concat(newTasks));
          } else if (taskType === "C") {
            const pendingTasks = getTasksByType("P");
            addTasks(pendingTasks.concat(newTasks));
          }
        }
      });
    });
  });

program.parse(process.args);
