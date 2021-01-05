import loadConfig from "../loadConfig";

describe(".loadConfig", () => {
  const getFixturePath = (fileName: string) =>
    `${__dirname}/../__fixtures__/loadConfig/${fileName}`;

  afterEach(() => {
    delete process.env.CONFIG_PATH;
  });

  it("should throw if CONFIG_PATH is missing", () => {
    expect(() => loadConfig()).toThrowError(/config_path not found/i);
  });

  it("should throw if registry is missing", () => {
    process.env.CONFIG_PATH = getFixturePath("noRegistry.yaml");
    expect(() => loadConfig()).toThrowError(
      /Expected top-level key 'registry'/
    );
  });

  it("should throw if policies is missing", () => {
    process.env.CONFIG_PATH = getFixturePath("noPolicies.yaml");
    expect(() => loadConfig()).toThrowError(
      /Expected top-level key 'policies'/
    );
  });

  it("should work for a single policy", () => {
    process.env.CONFIG_PATH = getFixturePath("singlePolicy.yaml");
    const result = loadConfig();
    expect(result.registry).toEqual("registry.example.com");
    expect(result.policies).toMatchObject([
      {
        repository: "my-image",
        maxTags: 5,
      },
    ]);
  });

  it("should work for multiple policies", () => {
    process.env.CONFIG_PATH = getFixturePath("multiplePolicies.yaml");
    const result = loadConfig();
    expect(result.registry).toEqual("registry.example.com");
    expect(result.policies).toMatchObject([
      {
        repository: "my-image",
        maxTags: 5,
      },
      {
        repository: "my-other-image",
        maxTags: 1,
      },
      {
        repository: "my-third-image",
        maxTags: 3,
      },
    ]);
  });
});
