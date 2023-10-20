import mongoose from "mongoose";
import { Event_type } from "../types/event";
const Schema = mongoose.Schema;

const eventSchema = new Schema<Event_type>({
  date: { type: String, required: true  },
  category: { type: String, required: true },
  title: { type: String, required: true },
  value: { type: Number, required: true },
  createdAt: { type: Date, required: true,default: Date.now  },

});
const eventModel = mongoose.model("Evento", eventSchema);
export { eventModel };
