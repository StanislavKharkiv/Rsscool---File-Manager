import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { createReadStream, createWriteStream } from "node:fs";
import { COLORS, ERRORS } from "./constants.js";
import { isDirectory, isFile } from "./helpers.js";

const notFile = "Not a file. If file name contains spaces use single quotes ''";
const errResp = "error";

export class Commands {
  #currentDir = "";

  constructor(dirPath) {
    this.#currentDir = dirPath;
  }

  #wrongCommand(text) {
    console.log(COLORS.yellow, text, COLORS.green);
    return ERRORS.errResp;
  }
  showCurrentDir() {
    console.log(
      COLORS.green,
      `Your current dir: ${this.#currentDir} ${os.EOL}`
    );
  }
  // NAVIGATION
  async cd(newPath) {
    const resolvedPath = path.resolve(this.#currentDir, newPath ?? "");
    if (!(await isDirectory(resolvedPath)))
      return this.#wrongCommand(ERRORS.notDir);
    this.#currentDir = resolvedPath;
    this.showCurrentDir();
  }

  async ls() {
    const dir = await fs.readdir(this.#currentDir);
    const dirTable = await Promise.all(
      dir.map(async (v) => {
        const isDir = await isDirectory(path.resolve(this.#currentDir, v));
        return { Name: v, Type: isDir ? "directory" : "file" };
      })
    );
    const sortedTable = dirTable.sort((a, b) => {
      if (a.Type === "directory") return -1;
      return 1;
    });

    this.showCurrentDir();
    console.table(sortedTable);
    console.log(COLORS.green);
  }

  up() {
    this.#currentDir = path.resolve(path.sep);
  }
  // FILES
  async cat(filePath) {
    const _path = path.resolve(this.#currentDir, filePath);
    if (!(await isFile(_path))) return this.#wrongCommand(ERRORS.notFile);
    const rs = createReadStream(_path);
    rs.pipe(process.stdout);
  }

  async add(fileName) {
    const isWrongName = fileName === undefined || !fileName.trim();
    if (isWrongName) return this.#wrongCommand("Write file name");
    await fs.writeFile(`${this.#currentDir}/${fileName}`, "");
  }

  async rn(filePath, fileName) {
    if (!filePath?.trim() || !fileName?.trim())
      return this.#wrongCommand("Wrong file name");

    const _path = path.resolve(this.#currentDir, filePath);
    if (!(await isFile(_path))) return this.#wrongCommand(ERRORS.notFile);
    await fs.rename(
      _path,
      _path.split(path.sep).slice(0, -1).join(path.sep) + path.sep + fileName
    );
  }

  async cp(filePath, newDirPath) {
    const _filePath = path.resolve(this.#currentDir, filePath);
    const _dirPath = path.resolve(this.#currentDir, newDirPath);
    const isCorrectArgs =
      (await isFile(_filePath)) && (await isDirectory(_dirPath));
    if (!isCorrectArgs) return this.#wrongCommand(ERRORS.wrongPath);

    createReadStream(_filePath).pipe(
      createWriteStream(path.resolve(_dirPath, path.basename(_filePath)))
    );
  }

  async rm(filePath) {
    const _filePath = path.resolve(this.#currentDir, filePath);
    if (!(await isFile(_filePath))) return this.#wrongCommand(notFile);
    fs.rm(_filePath);
  }

  async mv(filePath, newDirPath) {
    const resp = await this.cp(filePath, newDirPath);
    if (resp === errResp) return;
    await this.rm(filePath);
  }

  run(command, value, value2) {
    console.clear();
    console.log("COMMAND: ", command, value);
    const f = this[command]?.bind(this, value, value2);
    if (f) {
      f(value, value2);
    } else {
      this.#wrongCommand(ERRORS.wrongCommand);
    }
  }
}
