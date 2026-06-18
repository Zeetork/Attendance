import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILeave extends Document {
  companyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  leaveType: string;
  fromDate: Date;
  toDate: Date;
  numberOfDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  duration?: 'full_day' | 'half_day' | 'multiple_days';
  halfDaySession?: 'first_half' | 'second_half' | null;
  currentApprover?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  attachments?: string[];
}

const LeaveSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    leaveType: {
      type: String,
      required: true,
    },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    numberOfDays: { type: Number, required: true },
    duration: {
      type: String,
      enum: ['full_day', 'half_day', 'multiple_days'],
      default: 'full_day'
    },
    halfDaySession: {
      type: String,
      enum: ['first_half', 'second_half', null],
      default: null
    },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    currentApprover: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

LeaveSchema.index({ companyId: 1 });

const Leave: Model<ILeave> = mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema);
export default Leave;