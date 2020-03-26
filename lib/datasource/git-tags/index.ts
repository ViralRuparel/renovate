import { ReleaseResult, GetReleasesConfig } from '../common';
import * as semver from '../../versioning/semver';
import { logger } from '../../logger';
import * as gitRefs from '../git-refs';

export const id = 'git-tags';

const cacheNamespace = 'git-tags';
const cacheMinutes = 10;

export async function getPkgReleases({
  lookupName,
}: GetReleasesConfig): Promise<ReleaseResult | null> {
  try {
    const cachedResult = await renovateCache.get<ReleaseResult>(
      cacheNamespace,
      lookupName
    );
    /* istanbul ignore next line */
    if (cachedResult) {
      return cachedResult;
    }

    // fetch remote tags
    const rawRefs = await gitRefs.getRawRefs({ lookupName });

    const tags = rawRefs
      .filter(ref => ref.type === 'tags')
      .map(ref => ref.value)
      .filter(tag => semver.isVersion(tag));

    const sourceUrl = lookupName.replace(/\.git$/, '').replace(/\/$/, '');

    const result: ReleaseResult = {
      sourceUrl,
      releases: tags.map(tag => ({
        version: tag,
        gitRef: tag,
      })),
    };

    await renovateCache.set(cacheNamespace, lookupName, result, cacheMinutes);
    return result;
  } catch (err) {
    logger.debug({ err }, `Git-Tags lookup error in ${lookupName}`);
  }
  return null;
}
