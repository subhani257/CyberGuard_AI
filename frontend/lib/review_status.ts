export type HumanReviewStatus = 'pending' | 'confirmed' | 'updated' | null;

export interface HumanReviewCopy {
  status: Exclude<HumanReviewStatus, null>;
  label: string;
  message: string;
}

export function getHumanReviewStatus(
  humanReviewRequired?: boolean | null,
  adminVerdict?: string | null,
): HumanReviewStatus {
  const normalizedVerdict = adminVerdict?.trim().toLowerCase();
  if (normalizedVerdict === 'overridden') return 'updated';
  if (normalizedVerdict === 'confirmed') return 'confirmed';
  return humanReviewRequired ? 'pending' : null;
}

export function getHumanReviewCopy(status: Exclude<HumanReviewStatus, null>): HumanReviewCopy {
  if (status === 'confirmed') {
    return {
      status,
      label: 'Review confirmed',
      message: 'A human reviewer checked this evaluation and confirmed the result.',
    };
  }
  if (status === 'updated') {
    return {
      status,
      label: 'Result updated after review',
      message: 'A human reviewer checked this evaluation and changed its verdict.',
    };
  }
  return {
    status,
    label: 'Human review pending',
    message: 'This result is provisional while a human reviewer checks the evaluation. You can continue training normally.',
  };
}
