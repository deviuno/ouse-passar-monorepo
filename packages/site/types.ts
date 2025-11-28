export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  authorAvatar?: string;
  date: string;
  category: string;
  imageUrl: string;
  readTime: string;
  tags?: string[];
  keywords?: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatarUrl: string;
  approvedIn: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum ViewState {
  HOME = 'HOME',
  BLOG_LIST = 'BLOG_LIST',
  BLOG_POST = 'BLOG_POST',
  MENTORSHIP = 'MENTORSHIP', // Sales page / Details
}
