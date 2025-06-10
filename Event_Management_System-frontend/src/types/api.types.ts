export interface User {
  _id: string;
  username?: string; // Username might not be directly used, email is the main identifier
  email: string;
  password?: string; // Optional for user objects retrieved after login, but required for registration
  full_name: string;
  phone?: string;
  role: "student" | "club" | "admin";
  roles: Array<{
    role_id?: string;
    role_name: "student" | "club" | "admin";
    description?: string;
  }>;
  // Add other user properties as they appear in backend response
  created_at: string;
  updated_at: string;
}

export interface Event {
  _id?: string;
  club_id?: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  max_participants: number;
  banner_url: string;
  category: string;
  status: string;
  club?: {
    club_id: string;
    club_name: string;
  };
  registrations?: Array<{
    user_id: string;
    full_name: string;
    qr_code: string;
    registered_at: string;
  }>;
  feedbacks?: Array<{
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
  }>;
  notifications?: Array<{
    title: string;
    message: string;
    type: string;
    sent_at: string;
    sent: boolean;
  }>;
  created_at?: string;
  updated_at?: string;
  is_registered?: boolean;
  registered_count?: number;
  statistics?: {
    total_registered: number;
    total_checked_in: number;
    average_rating: string | null;
  };
}

export interface Club {
  _id: string;
  club_name: string;
  email: string;
  password?: string; // Only for registration/login, not usually returned
  description?: string;
  phone?: string;
  address?: string;
  established_date?: string;
  role: "club";
  members: Array<{
    user_id: string;
    full_name: string;
    role_in_club: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string; // e.g., 'system', 'event_update', 'reminder'
  recipient_id?: string; // Optional if notification is for all or specific users handled by backend
  event_id?: string; // If related to an event
  read: boolean;
  sent_at: string;
}

// Add other interfaces as needed
