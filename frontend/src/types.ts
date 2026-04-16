export type SlotStatus = 'available' | 'booked' | 'locked';

export interface TimeSlot {
  time: string; // e.g., "10:00"
  status: SlotStatus;
}

export interface CourtData {
  id: number;
  name: string;
  slots: TimeSlot[]; // Array from 10:00 to 22:00
}