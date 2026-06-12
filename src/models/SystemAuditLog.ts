import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISystemAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  action: string;
  details?: string;
  createdAt: Date;
}

const SystemAuditLogSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    action: { type: String, required: true },
    details: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SystemAuditLogSchema.index({ companyId: 1, action: 1 });

const SystemAuditLog: Model<ISystemAuditLog> = mongoose.models.SystemAuditLog || mongoose.model<ISystemAuditLog>('SystemAuditLog', SystemAuditLogSchema);
export default SystemAuditLog;
