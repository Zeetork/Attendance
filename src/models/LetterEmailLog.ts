import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILetterEmailLog extends Document {
  companyId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  generatedLetterId?: mongoose.Types.ObjectId;
  email: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LetterEmailLogSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'LetterTemplate' },
    generatedLetterId: { type: Schema.Types.ObjectId, ref: 'GeneratedLetter' },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
    sentAt: { type: Date },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

const LetterEmailLog: Model<ILetterEmailLog> =
  mongoose.models.LetterEmailLog || mongoose.model<ILetterEmailLog>('LetterEmailLog', LetterEmailLogSchema);

export default LetterEmailLog;
