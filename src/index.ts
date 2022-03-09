import axios from "axios";
import { DockerTag } from "./DockerTag";
import { getExpiredTags } from "./helpers/getExpiredTags";
import loadConfig from "./helpers/loadConfig";

require("dotenv").config();

const main = async () => {
  try {
    if (!process.env.REGISTRY_USERNAME || !process.env.REGISTRY_PASSWORD) {
      throw new Error(
        "REGISTRY_USERNAME and REGISTRY_PASSWORD are required in env"
      );
    }

    const config = loadConfig();

    for (let i = 0; i < config.policies.length; i++) {
      const policy = config.policies[i];

      if (!policy.repository) {
        throw new Error("Expected repository in policy but didn't find it");
      }

      console.log(
        `=== Checking repository ${policy.repository} (maxTags ${policy.maxTags})...`
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
      } catch (err: any) {
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

      // enrich with manifest data
      let enrichedTags: Array<DockerTag> = tags.map(
        (tag) => new DockerTag(config.registry, policy.repository, tag)
      );
      await Promise.all(enrichedTags.map((tag) => tag.enrich()));

      if (policy.maxTags) {
        const tagsToDelete = getExpiredTags(enrichedTags, policy.maxTags);

        if (tagsToDelete.length > 0) {
          console.log(
            `More tags present than policy allows; scheduling the following for deletion:`,
            tagsToDelete.map((t) => `${t.tag} (${t.digest})`)
          );

          await Promise.all(tagsToDelete.map((tag) => tag.delete()));
        } else {
          console.log(`Tag count is under policy limit; nothing to do!`);
        }
      }
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
  }
};

main().then(() => console.log("Done!"));
