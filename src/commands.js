import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream";

import { COLORS, ERRORS, COMPRESS_TYPE } from "./constants.js";
import { isDirectory, isFile, onExit } from "./helpers.js";

export class Commands {
  #currentDir = "";
  #userName = "";
  
  constructor(dirPath, user) {
    this.#currentDir = dirPath;
    this.#userName = user;
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
    this.showCurrentDir();
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
    const _filePath = path.resolve(this.#currentDir, filePath ?? "");
    const _dirPath = path.resolve(this.#currentDir, newDirPath ?? "");
    const isCorrectArgs =
      (await isFile(_filePath)) && (await isDirectory(_dirPath));
    if (!isCorrectArgs) return this.#wrongCommand(ERRORS.wrongPath);

    createReadStream(_filePath).pipe(
      createWriteStream(path.resolve(_dirPath, path.basename(_filePath)))
    );
  }

  async rm(filePath) {
    const _filePath = path.resolve(this.#currentDir, filePath ?? "");
    if (!(await isFile(_filePath))) return this.#wrongCommand(ERRORS.notFile);
    fs.rm(_filePath);
  }

  async mv(filePath, newDirPath) {
    const resp = await this.cp(filePath, newDirPath);
    if (resp === ERRORS.errResp) return;
    await this.rm(filePath);
  }
  // OS
  os(param) {
    const osCommands = {
      EOL: JSON.stringify(os.EOL),
      cpus: os.cpus(),
      homedir: os.homedir(),
      username: os.userInfo().username,
      architecture: os.arch(),
    };

    const command = param?.slice(2);
    if (command && Object.keys(osCommands).includes(command)) {
      console.log(osCommands[command]);
      return console.log(COLORS.green);
    }
    this.#wrongCommand(ERRORS.wrongCommand);
  }
  // HASH
  async hash(filePath) {
    const _filePath = path.resolve(this.#currentDir, filePath ?? "");
    if (!(await isFile(_filePath))) return this.#wrongCommand(ERRORS.notFile);

    const hash = crypto.createHash("sha256");
    const rs = createReadStream(_filePath);
    rs.on("readable", () => {
      const data = rs.read();
      if (data) {
        hash.update(data);
      } else {
        console.log(hash.digest("hex"), os.EOL);
      }
    });
  }
  // COMPRESS
  async compress(filePath, outputPath) {
    const _filePath = path.resolve(this.#currentDir, filePath ?? "");
    if (!(await isFile(_filePath))) return this.#wrongCommand(ERRORS.notFile);

    const _outputPath = path.resolve(this.#currentDir, outputPath ?? "");
    if (!(await isDirectory(_outputPath))) this.#wrongCommand(ERRORS.wrongPath);

    const newFileName = path.resolve(
      _outputPath,
      path.basename(_filePath) + COMPRESS_TYPE
    );

    pipeline(
      createReadStream(_filePath),
      zlib.createGzip(),
      createWriteStream(newFileName),
      () => console.log(COLORS.green, "OUTPUT: ", newFileName)
    );
  }

  async decompress(filePath, outputPath) {
    const _filePath = path.resolve(this.#currentDir, filePath ?? "");
    if (!(await isFile(_filePath))) return this.#wrongCommand(ERRORS.notFile);

    const _outputPath = path.resolve(this.#currentDir, outputPath ?? "");
    if (!(await isDirectory(_outputPath))) this.#wrongCommand(ERRORS.wrongPath);

    const fileName = path.basename(_filePath);
    const newFileName = path.resolve(
      _outputPath,
      fileName.slice(0, fileName.length - COMPRESS_TYPE.length)
    );

    pipeline(
      createReadStream(_filePath),
      zlib.createGunzip(),
      createWriteStream(newFileName),
      () => console.log(COLORS.green, "OUTPUT: ", newFileName)
    );
  }

  exit() {
    onExit(this.#userName);
  }
  // Run command
  run(command, value, value2) {
    console.clear();
    const f = this[command]?.bind(this, value, value2);

    if (f) {
      f(value, value2);
    } else {
      this.#wrongCommand(ERRORS.wrongCommand);
    }
  }
}
