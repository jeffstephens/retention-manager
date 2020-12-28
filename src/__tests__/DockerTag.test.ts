import { DateTime } from "luxon";
import { DockerTag } from "../DockerTag";

describe("DockerTag", () => {
  describe(".compare", () => {
    it("should work when a < b", () => {
      const a = new DockerTag("reg", "rep", "tagA");
      a.dateCreated = DateTime.utc().minus({ days: 1 });

      const b = new DockerTag("reg", "rep", "tagB");
      b.dateCreated = DateTime.utc();

      const subject = [b, a];

      const result = subject.sort(DockerTag.compare);
      expect(result).toEqual([a, b]);
    });

    it("should work when a > b", () => {
      const a = new DockerTag("reg", "rep", "tagA");
      a.dateCreated = DateTime.utc();

      const b = new DockerTag("reg", "rep", "tagB");
      b.dateCreated = DateTime.utc().minus({ days: 1 });

      const subject = [b, a];

      const result = subject.sort(DockerTag.compare);
      expect(result).toEqual([b, a]);
    });

    it("should fall back to digest when dateCreated is equal", () => {
      const refTime = DateTime.utc();

      const a = new DockerTag("reg", "rep", "tagA");
      a.dateCreated = refTime;
      a.digest = "a";

      const b = new DockerTag("reg", "rep", "tagB");
      b.dateCreated = refTime;
      b.digest = "b";

      const subject = [b, a];

      const result = subject.sort(DockerTag.compare);
      expect(result).toEqual([a, b]);
    });
  });
});
