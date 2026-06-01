import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IHoliday extends Document {
  holidayName: string;
  holidayType: 'public' | 'restricted' | 'company' | 'half-day' | 'working-day';
  description?: string;
  date: Date;
  isPaid: boolean;
  isRecurring: boolean;
  createdBy?: mongoose.Types.ObjectId;
}

const HolidaySchema: Schema = new Schema(
  {
    holidayName: { type: String, required: true },
    holidayType: { 
      type: String, 
      enum: ['public', 'restricted', 'company', 'half-day', 'working-day'],
      required: true 
    },
    description: { type: String },
    date: { type: Date, required: true },
    isPaid: { type: Boolean, default: true },
    isRecurring: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

const Holiday: Model<IHoliday> = mongoose.models.Holiday || mongoose.model<IHoliday>('Holiday', HolidaySchema);
export default Holiday;
