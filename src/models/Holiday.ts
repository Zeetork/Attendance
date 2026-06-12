import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IHoliday extends Document {
  companyId: mongoose.Types.ObjectId;
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
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
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

HolidaySchema.index({ companyId: 1 });

const Holiday: Model<IHoliday> = mongoose.models.Holiday || mongoose.model<IHoliday>('Holiday', HolidaySchema);
export default Holiday;
