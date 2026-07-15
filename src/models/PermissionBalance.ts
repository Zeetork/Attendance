import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPermissionBalance extends Document {
  companyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  year: number;
  month: number; // 1-12
  allowedMinutes: number; // usually 120
  usedMinutes: number;
  remainingMinutes: number;
}

const PermissionBalanceSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    allowedMinutes: { type: Number, default: 120 },
    usedMinutes: { type: Number, default: 0 },
    remainingMinutes: { type: Number, default: 120 }
  },
  { timestamps: true }
);

PermissionBalanceSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });
PermissionBalanceSchema.index({ companyId: 1 });

const PermissionBalance: Model<IPermissionBalance> = mongoose.models.PermissionBalance || mongoose.model<IPermissionBalance>('PermissionBalance', PermissionBalanceSchema);
export default PermissionBalance;
