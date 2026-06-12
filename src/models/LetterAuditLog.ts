import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILetterAuditLog extends Document {
  companyId: mongoose.Types.ObjectId;
  action: 'CREATED' | 'MODIFIED' | 'SENT' | 'DOWNLOADED' | 'DELETED';
  performedBy: mongoose.Types.ObjectId;
  performedAt: Date;
  metadata: Record<string, any>; // stores ids like templateId, generatedLetterId, employeeId, etc.
  createdAt: Date;
  updatedAt: Date;
}

const LetterAuditLogSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    action: { type: String, enum: ['CREATED', 'MODIFIED', 'SENT', 'DOWNLOADED', 'DELETED'], required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const LetterAuditLog: Model<ILetterAuditLog> =
  mongoose.models.LetterAuditLog || mongoose.model<ILetterAuditLog>('LetterAuditLog', LetterAuditLogSchema);

export default LetterAuditLog;
