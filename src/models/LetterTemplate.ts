import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILetterTemplate extends Document {
  companyId: mongoose.Types.ObjectId;
  templateName: string;
  category: string;
  subject: string;
  content: string; // HTML or rich text with placeholders
  placeholders: string[]; // List of required placeholders like ['employeeName', 'bonusAmount']
  customVariables: { name: string; type: string }[]; // e.g., [{ name: 'bonusAmount', type: 'Number' }]
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LetterTemplateSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    templateName: { type: String, required: true },
    category: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    placeholders: { type: [String], default: [] },
    customVariables: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const LetterTemplate: Model<ILetterTemplate> =
  mongoose.models.LetterTemplate || mongoose.model<ILetterTemplate>('LetterTemplate', LetterTemplateSchema);

export default LetterTemplate;
