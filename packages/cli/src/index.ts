import { type Command, cli } from "gunshi";
import { description, name, version } from "../package.json";
import { analyze } from "./commands/analyze";
import { dev } from "./commands/dev";

const subCommands = new Map<string, Command>();
subCommands.set("dev", dev);
subCommands.set("analyze", analyze);

await cli(process.argv.slice(2), dev, {
  name,
  version,
  description,
  subCommands,
});
