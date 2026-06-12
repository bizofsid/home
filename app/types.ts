export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface SearchResult {
  sessionId: string;
  sessionTitle: string;
  messageId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  highlight: string;
}

export type AssetType =
  | "residence"
  | "jet"
  | "yacht"
  | "vehicle"
  | "watercraft"
  | "aircraft"
  | "office"
  | "equipment";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  location: string;
  status: string;
  /** Assets nest: a jetski lives on the yacht, the Maybach at the penthouse. */
  parentId?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  /** Geographic + skill tags for flexible allocation, e.g. ["NYC", "Hamptons", "driving"]. */
  tags: string[];
  /** Mobile number for SMS cue dispatch, e.g. "+12125551234". */
  phone?: string;
  /** Instagram handle (no @) for DM cue dispatch. */
  instagram?: string;
}

export interface ScheduleItem {
  id: string;
  time: string; // "HH:MM" 24h
  title: string;
  assetId?: string;
  staffIds: string[];
  notes?: string;
}

export type CueStatus = "pending" | "acknowledged" | "done";

/**
 * Every cue optimizes one of the principal's five resources:
 * time, space, money, matter, or value-efficiency.
 */
export type CueDimension = "time" | "space" | "money" | "matter" | "value";

export interface StaffCue {
  id: string;
  staffId: string;
  instruction: string;
  dimension: CueDimension;
  time?: string;
  status: CueStatus;
  createdAt: number;
}

export interface HouseholdState {
  assets: Asset[];
  staff: StaffMember[];
  schedule: ScheduleItem[];
  cues: StaffCue[];
}
