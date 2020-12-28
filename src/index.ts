import yaml from "js-yaml";
import axios from "axios";
import { readFileSync } from "fs";
import { DockerTag } from "./DockerTag";
require("dotenv").config();

const main = async () => {
  try {
    if (!process.env.CONFIG_PATH) {
      throw new Error("CONFIG_PATH not found in env");
    }

    if (!process.env.REGISTRY_USERNAME || !process.env.REGISTRY_PASSWORD) {
      throw new Error(
        "REGISTRY_USERNAME and REGISTRY_PASSWORD are required in env"
      );
    }

    const config = yaml.safeLoad(
      readFileSync(process.env.CONFIG_PATH, "utf8")
    ) as YamlConfig;

    if (!config.registry) {
      throw new Error("Expected top-level key 'registry' but didn't find it");
    }
    if (!config.policies) {
      throw new Error("Expected top-level key 'policies' but didn't find it");
    }

    await Promise.all(
      config.policies.map(async (policy) => {
        if (!policy.repository) {
          throw new Error("Expected repository in policy but didn't find it");
        }

        console.log(
          `Checking repository ${policy.repository} (maxTags ${policy.maxTags})...`
        );

        // get list of tags
        let tags: Array<string> = [];
        try {
          const response = await axios.get(
            `https://${config.registry}/v2/${policy.repository}/tags/list`,
            {
              auth: {
                username: process.env.REGISTRY_USERNAME!,
                password: process.env.REGISTRY_PASSWORD!,
              },
              headers: {
                Accept: "application/vnd.docker.distribution.manifest.v2+json",
              },
            }
          );

          const { data } = response;
          data.tags.forEach((tag: string) => {
            tags.push(tag);
          });
        } catch (err) {
          if (err.response) {
            const firstError = err.response.data.errors.pop();
            throw new Error(
              `${firstError.code} while listing tags: ${firstError.message}`
            );
          } else {
            throw err;
          }
        }

        console.log(`Found ${tags.length} tags`);

        if (policy.maxTags && tags.length <= policy.maxTags) {
          console.log(`Tag count is under policy maximum; nothing to do!`);
          return;
        }

        // enrich with manifest data
        let enrichedTags: Array<DockerTag> = tags.map(
          (tag) => new DockerTag(config.registry, policy.repository, tag)
        );
        await Promise.all(enrichedTags.map((tag) => tag.enrich()));

        // sort by date created
        enrichedTags = enrichedTags.sort(DockerTag.compare);

        if (policy.maxTags) {
          const overage = tags.length - policy.maxTags;
          const tagsToDelete = enrichedTags.slice(0, overage);

          console.log(
            `More tags present than policy allows; scheduling the following for deletion:`,
            tagsToDelete.map((t) => `${t.tag} (${t.digest})`)
          );
        }
      })
    );
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
};

main();
