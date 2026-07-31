import { Types } from 'mongoose';

export const EVENT_CATEGORIES = [
  'expense',
  'income',
  'food',
  'leisure',
  'transport',
  'investment',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export type Event_type = {
  date: string;
  category: EventCategory;
  title: string;
  value: number;
  ownerId?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};
