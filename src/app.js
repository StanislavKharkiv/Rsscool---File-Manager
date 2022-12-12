import process, { stdin } from "node:process";
import { COLORS } from "./constants.js";
import { getUserName, getDirName } from "./helpers.js";
import { Commands } from "./commands.js";

export function app() {
  console.log(COLORS.blue, `Welcome to the File Manager, ${getUserName()}!`);
  const commands = new Commands(getDirName(import.meta.url));
  commands.showCurrentDir();

  stdin.on("data", (data) => {
    let parsedCommand;
    const inputStr = data.toString().trim();
    const hasQuotes = /[']/.test(inputStr);
    console.log("hasQuotes ", hasQuotes);
    if (hasQuotes) {
      parsedCommand = inputStr.split("'").map(str => str.trim()).filter(str => str !== '')
    } else {
      parsedCommand = inputStr.split(" ");
    }
    commands.run(parsedCommand[0], parsedCommand[1], parsedCommand[2]);
  });

  process.on("SIGINT", () => {
    console.log(
      COLORS.blue,
      `Thank you for using File Manager, ${getUserName()}!, goodbye`
    );
    process.exit(0);
  });
}
