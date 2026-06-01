import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IShift extends Document {
  shiftName: string;
  startTime: string; // e.g. "07:30"
  endTime: string;   // e.g. "16:30"
  graceTime: number; // in minutes
  isActive: boolean;
}

const ShiftSchema: Schema = new Schema(
  {
    shiftName: { type: String, required: true, unique: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    graceTime: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Shift: Model<IShift> = mongoose.models.Shift || mongoose.model<IShift>('Shift', ShiftSchema);
export default Shift;
