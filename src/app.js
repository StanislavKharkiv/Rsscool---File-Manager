import process, { stdin } from "node:process";
import { COLORS } from "./constants.js";
import { getUserName, getDirName, onExit } from "./helpers.js";
import { Commands } from "./commands.js";

export function app() {
  const userName = getUserName();
  console.log(COLORS.blue, `Welcome to the File Manager, ${userName}!`);
  const commands = new Commands(getDirName(import.meta.url), userName);
  commands.showCurrentDir();
 
  stdin.on("data", (data) => {
    let parsedCommand;
    const inputStr = data.toString().trim();
    const hasQuotes = /[']/.test(inputStr);

    if (hasQuotes) {
      parsedCommand = inputStr.split("'").map(str => str.trim()).filter(str => str !== '')
    } else {
      parsedCommand = inputStr.split(" ");
    }
    commands.run(parsedCommand[0], parsedCommand[1], parsedCommand[2]);
  });

  process.on("SIGINT", () => onExit(userName));
}
