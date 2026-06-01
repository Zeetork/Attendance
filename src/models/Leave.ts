import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILeave extends Document {
  userId: mongoose.Types.ObjectId;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Paid Leave' | 'Unpaid Leave';
  fromDate: Date;
  toDate: Date;
  reason: string;
  status: 'pending' | 'pending_admin_approval' | 'approved' | 'rejected';
  currentApprover?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
}

const LeaveSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    leaveType: {
      type: String,
      enum: ['Casual Leave', 'Sick Leave', 'Paid Leave', 'Unpaid Leave'],
      required: true,
    },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'pending_admin_approval', 'approved', 'rejected'], default: 'pending' },
    currentApprover: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Leave: Model<ILeave> = mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema);
export default Leave;
