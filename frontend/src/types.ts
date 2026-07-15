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
  title: string;
  description: string;
  category: string;
  condition: string;
  imageUrl?: string;
  available: boolean;
  owner?: User;
  ownerId: string;
  createdAt: string;
}

export interface PeerLoan {
  id: string;
  listing?: PeerListing;
  listingId: string;
  borrower?: User;
  borrowerId: string;
  status: 'requested' | 'approved' | 'active' | 'returned' | 'rejected';
  borrowerRating?: number;
  lenderRating?: number;
  createdAt: string;
}

export interface LostFoundItem {
  id: string;
  type: 'lost' | 'found';
  description: string;
  lastSeenLocation: string;
  loggedAt: string;
  photoUrl?: string;
  status: string; // 'reported' | 'resolved'
  matchedWithId?: string;
  matchProbability?: number;
  reportedBy?: User;
  reportedById: string;
  createdAt: string;
}

export interface StudyGroupInterest {
  id: string;
  module: string;
  studyStyle: string;
  preferredSlots: string[];
  matched: boolean;
  matchedGroup?: string;
  user?: User;
  userId: string;
  createdAt: string;
}

/* --- AI Response Types --- */

export interface AISearchResult {
  assets: Asset[];
  rationale: string;
  predictedReturnDate?: string;
  fallbackSuggestion?: string;
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
