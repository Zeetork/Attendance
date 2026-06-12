import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGeneratedLetter extends Document {
  companyId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  pdfUrl?: string; // S3 or Cloudinary URL or local path
  status: 'DRAFT' | 'GENERATED' | 'SENT';
  variables: Record<string, any>; // Stores the dynamic variable values used
  content: string; // The fully generated content (if we want to save it) or just for draft
  generatedAt?: Date;
  generatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedLetterSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'LetterTemplate', required: true },
    pdfUrl: { type: String },
    status: { type: String, enum: ['DRAFT', 'GENERATED', 'SENT'], default: 'DRAFT' },
    variables: { type: Schema.Types.Mixed, default: {} },
    content: { type: String }, // Useful for drafts
    generatedAt: { type: Date },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const GeneratedLetter: Model<IGeneratedLetter> =
  mongoose.models.GeneratedLetter || mongoose.model<IGeneratedLetter>('GeneratedLetter', GeneratedLetterSchema);

export default GeneratedLetter;
