import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOvertimeRequest extends Document {
  companyId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  approverId: mongoose.Types.ObjectId;
  date: Date;
  hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

const OvertimeRequestSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    hours: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

OvertimeRequestSchema.index({ companyId: 1 });

const OvertimeRequest: Model<IOvertimeRequest> = mongoose.models.OvertimeRequest || mongoose.model<IOvertimeRequest>('OvertimeRequest', OvertimeRequestSchema);
export default OvertimeRequest;
