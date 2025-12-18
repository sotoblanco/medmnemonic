
import { SRSMetadata } from "../types";

/**
 * SM-2 Algorithm Implementation
 * Quality scale (q):
 * 0-2: Failure (Reset)
 * 3: Hard (Success)
 * 4: Good (Success)
 * 5: Easy (Success)
 */
export const calculateNextSRS = (quality: number, current?: SRSMetadata): SRSMetadata => {
  let { n, ef, i } = current || { n: 0, ef: 2.5, i: 0 };

  if (quality >= 3) {
    // Success
    if (n === 0) {
      i = 1;
    } else if (n === 1) {
      i = 6;
    } else {
      i = Math.round(i * ef);
    }
    n++;
  } else {
    // Failure
    n = 0;
    i = 1;
  }

  // Update Ease Factor (ef)
  ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ef < 1.3) ef = 1.3;

  const lastReview = Date.now();
  const nextReview = lastReview + i * 24 * 60 * 60 * 1000;

  return { n, ef, i, lastReview, nextReview };
};

export const isDue = (metadata?: SRSMetadata): boolean => {
  if (!metadata) return true;
  return Date.now() >= metadata.nextReview;
};
