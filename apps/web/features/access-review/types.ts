export type AccessReviewEntry = {
  membershipId: string;
  memberName: string;
  roles: string[];
  sensitivePermissions: string[];
  lastReviewedAt?: string | null;
};
