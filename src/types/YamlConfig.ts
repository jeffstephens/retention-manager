interface Policy {
  repository: string;
  maxTags?: number;
}

interface YamlConfig {
  registry: string;
  policies: Array<Policy>;
}
