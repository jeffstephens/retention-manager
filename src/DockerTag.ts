import axios from "axios";
import { DateTime } from "luxon";

export class DockerTag {
  registry: string;
  repository: string;
  tag: string;

  digest: string;
  dateCreated: DateTime;

  constructor(registry: string, repository: string, tag: string) {
    this.registry = registry;
    this.repository = repository;
    this.tag = tag;
  }

  public static compare(a: DockerTag, b: DockerTag) {
    if (a.dateCreated < b.dateCreated) {
      return -1;
    }
    if (b.dateCreated < a.dateCreated) {
      return 1;
    }

    if (a.digest < b.digest) {
      return -1;
    }
    if (b.digest < a.digest) {
      return 1;
    }

    return 0;
  }

  /**
   * Fetch object properties from Docker registry
   */
  async enrich() {
    this.digest = await this.getDigest();
    this.dateCreated = await this.getCreateDate();
    return;
  }

  private async getDigest(): Promise<string> {
    const response = await axios.head(
      `https://${this.registry}/v2/${this.repository}/manifests/${this.tag}`,
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

    return response.headers["docker-content-digest"];
  }

  private async getCreateDate(): Promise<DateTime> {
    // V2 API doesn't have create date, but V1 does :shrug:
    const response = await axios.get(
      `https://${this.registry}/v2/${this.repository}/manifests/${this.tag}`,
      {
        auth: {
          username: process.env.REGISTRY_USERNAME!,
          password: process.env.REGISTRY_PASSWORD!,
        },
      }
    );

    const topLayer = JSON.parse(response.data.history[0].v1Compatibility);
    return DateTime.fromISO(topLayer.created);
  }
}
