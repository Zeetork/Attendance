import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMissPunch extends Document {
  companyId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  approverId: mongoose.Types.ObjectId;
  date: Date;
  requestType: 'Forgot Check In' | 'Forgot Check Out' | 'Missed Both';
  requestedCheckIn?: Date;
  requestedCheckOut?: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

const MissPunchSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    requestType: { type: String, enum: ['Forgot Check In', 'Forgot Check Out', 'Missed Both'], required: true },
    requestedCheckIn: { type: Date },
    requestedCheckOut: { type: Date },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

MissPunchSchema.index({ companyId: 1 });

const MissPunch: Model<IMissPunch> = mongoose.models.MissPunch || mongoose.model<IMissPunch>('MissPunch', MissPunchSchema);
export default MissPunch;
