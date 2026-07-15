/* Shared TypeScript types matching the actual backend entities */

export type Role = 'student' | 'staff' | 'lfofficer' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  faculty: string;
  department?: Department;
  departmentId?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  faculty: string;
}

/* Asset uses "category" not "type", "condition" not "conditionScore" */
export type AssetCategory = 'equipment' | 'room' | 'loanable';
export type AssetStatus = 'available' | 'booked' | 'maintenance' | 'retired';
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'damaged';

export interface Asset {
  id: string;
  name: string;
  description: string;
  category: AssetCategory;
  status: AssetStatus;
  condition: AssetCondition;
  departmentId: string;
  department?: Department;
  photoUrl?: string;
  bookingLeadTime: number;
  isHighValue: boolean;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  asset?: Asset;
  assetId: string;
  user?: User;
  userId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  managerComment?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface PeerListing {
  id: string;
  name: string;
  description: string;
  category: string;
  condition: string;
  photoUrl?: string;
  status: string;
  owner?: User;
  ownerId: string;
}

export interface PeerLoan {
  id: string;
  listing?: PeerListing;
  listingId: string;
  borrower?: User;
  borrowerId: string;
  status: string;
  borrowerRating?: number;
  lenderRating?: number;
  borrowerReview?: string;
  lenderReview?: string;
}

export interface LostFoundItem {
  id: string;
  type: 'lost' | 'found';
  description: string;
  lastSeenLocation: string;
  loggedAt: string;
  photoUrl?: string;
  condition?: string;
  status: string;
  matchedWithId?: string;
  matchProbability?: number;
  reportedBy?: User;
  reportedById: string;
}

export interface StudyGroupInterest {
  id: string;
  moduleCode: string;
  preferredStyle: string;
  availabilitySlots: string[];
  status: string;
  matchedWithId?: string;
  user?: User;
  userId: string;
}

/* --- AI Response Types --- */

export interface AISearchResult {
  matches: Array<{
    asset: Asset;
    rationale: string;
    predictedReturnDate: string;
  }>;
  alternatives: Asset[];
}

export interface ConditionAssessment {
  overallScore: number;
  summary: string;
  details: string[];
  recommendations: string[];
}

export interface StudyGroupMatch {
  interestId: string;
  userId: string;
  email: string;
  preferredStyle: string;
  slots: string[];
  compatibilityScore: number;
  rationale: string;
}

export interface AnomalyReport {
  assetId: string;
  assetName: string;
  anomalyType: 'bottleneck' | 'idle' | 'overuse';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  weeklyUsage: number[];
}

/* --- Auth --- */

export interface LoginResponse {
  access_token: string;
  user: User;
}
