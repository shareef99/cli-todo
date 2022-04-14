import { homedir } from "os";
import { join } from "path";
import { readFileSync, writeFileSync } from "fs";
import chalk from "chalk";

export const filePath = join(homedir(), "tasks.json");

export const getTasks = () => {
  let tasks;
  try {
    tasks = JSON.parse(readFileSync(filePath));
  } catch (e) {
    tasks = [];
  }
  return tasks;
};

export const getPendingTasks = () => {
  const tasks = getTasks();
  return tasks.filter((task) => !task.completed);
};

export const getCompletedTasks = () => {
  const tasks = getTasks();
  return tasks.filter((task) => task.completed);
};

export const addTasks = (tasks) => {
  writeFileSync(filePath, JSON.stringify(tasks));
};

export const displayPendingTasks = () => {
  console.log(chalk.yellow.underline("\nPending tasks"));
  const tasks = getPendingTasks();
  if (tasks.length === 0) {
    console.log(chalk.green("Hurry! You have completed all the tasks"));
  } else {
    tasks.forEach((task, index) => {
      console.log(`${index + 1} - ${task.task}`);
    });
  }
};

export const displayCompletedTasks = () => {
  console.log(chalk.green.underline("\nCompleted tasks"));
  const tasks = getCompletedTasks();
  if (tasks.length === 0) {
    console.log(chalk.red("You have not completed any tasks yet"));
  } else {
    tasks.forEach((task, index) => {
      console.log(`${index + 1} - ${task.task}`);
    });
  }
};
