import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWFHRequest extends Document {
  companyId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  approverId: mongoose.Types.ObjectId;
  fromDate: Date;
  toDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

const WFHRequestSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

WFHRequestSchema.index({ companyId: 1 });

const WFHRequest: Model<IWFHRequest> = mongoose.models.WFHRequest || mongoose.model<IWFHRequest>('WFHRequest', WFHRequestSchema);
export default WFHRequest;
