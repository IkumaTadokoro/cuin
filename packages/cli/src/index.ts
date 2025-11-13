import { type Command, cli } from "gunshi";
import { dev } from "./commands/dev";

const subCommands = new Map<string, Command>();
subCommands.set("dev", dev);

await cli(process.argv.slice(2), dev, {
  name: "cuin",
  version: "0.0.1",
  description: "component usage inspector for React projects",
  subCommands,
});
