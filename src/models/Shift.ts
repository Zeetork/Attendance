import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IShift extends Document {
  companyId: mongoose.Types.ObjectId;
  shiftName: string;
  startTime: string; // e.g. "07:30"
  endTime: string;   // e.g. "16:30"
  workingDays: string[]; // e.g. ["Monday", "Tuesday"]
  graceTime: number; // in minutes
  isActive: boolean;
}

const ShiftSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    shiftName: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    workingDays: [{ type: String }],
    graceTime: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ShiftSchema.index({ companyId: 1, shiftName: 1 }, { unique: true });

const Shift: Model<IShift> = mongoose.models.Shift || mongoose.model<IShift>('Shift', ShiftSchema);
export default Shift;
