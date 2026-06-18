import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILeavePolicy extends Document {
  companyId?: mongoose.Types.ObjectId;
  leaveTypeName: string;
  allowHalfDay: boolean;
  maxHalfDayPerMonth: number;
  deductValue: {
    fullDay: number;
    halfDay: number;
  };
}

const LeavePolicySchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
    leaveTypeName: { type: String, required: true },
    allowHalfDay: { type: Boolean, default: true },
    maxHalfDayPerMonth: { type: Number, default: 0 },
    deductValue: {
      fullDay: { type: Number, default: 1 },
      halfDay: { type: Number, default: 0.5 }
    }
  },
  { timestamps: true }
);

LeavePolicySchema.index({ companyId: 1 });

const LeavePolicy: Model<ILeavePolicy> = mongoose.models.LeavePolicy || mongoose.model<ILeavePolicy>('LeavePolicy', LeavePolicySchema);
export default LeavePolicy;
