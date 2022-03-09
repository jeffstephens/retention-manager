interface Policy {
  repository: string;
  maxTags?: number;
  preserveChannels?: boolean;
}

interface YamlConfig {
  registry: string;
  policies: Array<Policy>;
}
