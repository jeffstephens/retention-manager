import yaml from "js-yaml";
import { readFileSync } from "fs";

const loadConfig = (): YamlConfig => {
  if (!process.env.CONFIG_PATH) {
    throw new Error("CONFIG_PATH not found in env");
  }

  const config = yaml.load(
    readFileSync(process.env.CONFIG_PATH, "utf8")
  ) as YamlConfig;

  if (!config.registry) {
    throw new Error("Expected top-level key 'registry' but didn't find it");
  }
  if (!config.policies) {
    throw new Error("Expected top-level key 'policies' but didn't find it");
  }

  return config;
};

export default loadConfig;
