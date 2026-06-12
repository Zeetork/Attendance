import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEmployeeLeaveBalance extends Document {
  companyId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  year: number;
  casualLeaveEntitled: number;
  casualLeaveUsed: number;
  sickLeaveEntitled: number;
  sickLeaveUsed: number;
  restrictedHolidayEntitled: number;
  restrictedHolidayUsed: number;
  compOffAvailable: number;
  leaveWithoutPayUsed: number;
}

const EmployeeLeaveBalanceSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    year: { type: Number, required: true },
    casualLeaveEntitled: { type: Number, default: 0 },
    casualLeaveUsed: { type: Number, default: 0 },
    sickLeaveEntitled: { type: Number, default: 12 },
    sickLeaveUsed: { type: Number, default: 0 },
    restrictedHolidayEntitled: { type: Number, default: 2 },
    restrictedHolidayUsed: { type: Number, default: 0 },
    compOffAvailable: { type: Number, default: 0 },
    leaveWithoutPayUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index for quick lookup
EmployeeLeaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

EmployeeLeaveBalanceSchema.index({ companyId: 1 });

const EmployeeLeaveBalance: Model<IEmployeeLeaveBalance> = mongoose.models.EmployeeLeaveBalance || mongoose.model<IEmployeeLeaveBalance>('EmployeeLeaveBalance', EmployeeLeaveBalanceSchema);
export default EmployeeLeaveBalance;
