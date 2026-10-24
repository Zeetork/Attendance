import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBonusEmployee {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  name: string;
  department?: string;
  designation?: string;
  monthlySalary: number;
  basicSalary: number;
  bonusAmount: number;
  remarks?: string;
}

export interface IBonusHistory extends Document {
  companyId?: mongoose.Types.ObjectId;
  title: string;
  month: number;
  year: number;
  employees: IBonusEmployee[];
  totalAmount: number;
  distributedCount: number;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BonusHistorySchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    title: { type: String, required: true, trim: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    employees: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        employeeId: { type: String, required: true },
        name: { type: String, required: true },
        department: { type: String },
        designation: { type: String },
        monthlySalary: { type: Number, default: 0 },
        basicSalary: { type: Number, default: 0 },
        bonusAmount: { type: Number, default: 0 },
        remarks: { type: String }
      }
    ],
    totalAmount: { type: Number, default: 0 },
    distributedCount: { type: Number, default: 0 },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

BonusHistorySchema.index({ companyId: 1, year: 1, month: 1 });

const BonusHistory: Model<IBonusHistory> = mongoose.models.BonusHistory || mongoose.model<IBonusHistory>('BonusHistory', BonusHistorySchema);
export default BonusHistory;
