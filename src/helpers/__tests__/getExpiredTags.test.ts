import { DateTime } from "luxon";
import { DockerTag } from "../../DockerTag";
import { getExpiredTags } from "../getExpiredTags";

describe(".getExpiredTags", () => {
  const tagA = new DockerTag("reg", "repo", "A");
  tagA.dateCreated = DateTime.utc().minus({ days: 5 });
  tagA.digest = "digestA";

  const tagB = new DockerTag("reg", "repo", "B");
  tagB.dateCreated = DateTime.utc().minus({ days: 4 });
  tagB.digest = "digestB";

  const tagC = new DockerTag("reg", "repo", "C");
  tagC.dateCreated = DateTime.utc().minus({ days: 3 });
  tagC.digest = "digestC";

  it("should return [] below the limit", () => {
    const subject = [tagA, tagB, tagC];
    expect(getExpiredTags(subject, 5)).toEqual([]);
  });

  it("should return the oldest tag over the limit", () => {
    const subject = [tagC, tagA, tagB];
    expect(getExpiredTags(subject, 2)).toEqual([tagA]);
  });

  it("should return nothing if the overage was retagged", () => {
    // older tag with the same digest as tagA; should not be deleted since tagA still references the digest
    const retagged = new DockerTag("reg", "repo", "RETAG");
    retagged.dateCreated = DateTime.utc().minus({ days: 10 });
    retagged.digest = "digestA";

    const subject = [tagA, retagged, tagC];
    expect(getExpiredTags(subject, 2)).toEqual([]);
  });

  it("should preserve all unique channels", () => {
    const channelA = new DockerTag("reg", "repo", "A-production");
    channelA.dateCreated = DateTime.utc().minus({ days: 5 });
    channelA.digest = "digestA";

    const channelB = new DockerTag("reg", "repo", "B-staging");
    channelB.dateCreated = DateTime.utc().minus({ days: 4 });
    channelB.digest = "digestB";

    const channelC = new DockerTag("reg", "repo", "C-canary");
    channelC.dateCreated = DateTime.utc().minus({ days: 3 });
    channelC.digest = "digestC";

    const channelD = new DockerTag("reg", "repo", "D-production");
    channelD.dateCreated = DateTime.utc().minus({ days: 2 });
    channelD.digest = "digestD";

    const subject = [channelA, channelB, channelC, channelD];
    expect(getExpiredTags(subject, 1, true)).toEqual([channelA]);
  });
});
