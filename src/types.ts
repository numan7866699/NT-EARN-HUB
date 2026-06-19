export interface UserProfile {
  uid: string;
  fullname: string;
  username: string;
  email: string;
  country: string;
  balance: number;
  pending: number;
  refEarnings: number;
  referredBy: string;
  profilePicUrl?: string;
  completedTasks?: Record<string, number>; // NEW: Server timestamp tracking for 24-hour lock
}

export interface Task {
  id: string;
  title: string;
  reward: number;
  destination: string;
  category: 'Watch Ads' | 'Short Videos' | 'Micro Tasks';
}

export interface Transaction {
  id: string;
  type: 'Task Reward' | 'Referral Commission' | 'Withdrawal Request';
  amount: number;
  status: 'completed' | 'pending' | 'rejected';
  details: string;
  date: string;
}

export interface ReferralRecord {
  id: string;
  fromUser: string;
  commission: number;
  date: string;
}

export interface SupportTicket {
  ticketId: string;
  uid: string;
  fullname: string;
  username: string;
  email: string;
  subject: string;
  description: string;
  attachmentUrl?: string;
  status: 'open' | 'resolved';
  timestamp: string;
}

export interface MonetizationSettings {
  adsterraDirectLink: string;
  monetagSmartlink: string;
  cpaLeadOfferwall: string;
  shortVideoFeed: string;
  microTasksOfferwall: string;
}
