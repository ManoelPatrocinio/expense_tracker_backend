import mongoose from 'mongoose';
import { EVENT_CATEGORIES, Event_type } from '../types/event';

const Schema = mongoose.Schema;

const eventSchema = new Schema<Event_type>(
  {
    date: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      enum: [...EVENT_CATEGORIES],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    value: { type: Number, required: true },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ ownerId: 1, date: 1 });

const eventModel = mongoose.model<Event_type>('Evento', eventSchema);

export { eventModel };
