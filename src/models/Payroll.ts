import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPayroll extends Document {
  userId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  monthlySalary: number;
  deductions: number;
  finalSalary: number;
  payslipUrl?: string;
  generatedAt: Date;
}

const PayrollSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    totalWorkingDays: { type: Number, required: true },
    presentDays: { type: Number, required: true },
    absentDays: { type: Number, required: true },
    halfDays: { type: Number, required: true },
    monthlySalary: { type: Number, required: true },
    deductions: { type: Number, required: true },
    finalSalary: { type: Number, required: true },
    payslipUrl: { type: String },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Ensure one payroll per user per month-year
PayrollSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

const Payroll: Model<IPayroll> = mongoose.models.Payroll || mongoose.model<IPayroll>('Payroll', PayrollSchema);
export default Payroll;
