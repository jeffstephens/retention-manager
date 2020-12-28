import { DockerTag } from "../DockerTag";

export const getExpiredTags = (
  tags: Array<DockerTag>,
  maxTags: number
): Array<DockerTag> => {
  const sortedTags = tags.sort(DockerTag.compare);

  const overage = tags.length - maxTags;
  if (overage < 1) {
    return [];
  }

  const tagsToDelete = sortedTags.slice(0, overage);

  // make sure we don't delete a digest that's still in use
  const activeDigests = new Map<string, null>();
  sortedTags.slice(overage).reduce((acc, tag) => {
    acc.set(tag.digest, null);
    return acc;
  }, activeDigests);

  return tagsToDelete.filter((tag) => !activeDigests.has(tag.digest));
};
