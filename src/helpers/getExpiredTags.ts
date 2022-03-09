import { DockerTag } from "../DockerTag";

/**
 * Return a list of DockerTags that can be safely deleted.
 * @param tags The list of tags under consideration
 * @param maxTags The maximum number of tags to keep
 * @param preserveChannels Whether to preserve at least one tag per unique "channel" (-production, etc.)
 */
export const getExpiredTags = (
  tags: Array<DockerTag>,
  maxTags: number,
  preserveChannels = false
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

  // if requested, make sure we keep at least one tag per unique "channel" (-production, etc.)
  const channels = new Map<string, null>();
  const channelTagsToPreserve: string[] = [];
  if (preserveChannels) {
    for (let i = sortedTags.length - 1; i >= 0; i--) {
      const tag = sortedTags[i];
      const channelParse = tag.tag.split("-");

      if (channelParse.length === 2) {
        if (!channels.has(channelParse[1])) {
          channels.set(channelParse[1], null);
          channelTagsToPreserve.push(tag.tag);
        }
      }
    }
  }

  return tagsToDelete
    .filter((tag) => !activeDigests.has(tag.digest))
    .filter((tag) => !channelTagsToPreserve.includes(tag.tag));
};
