import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAttendance extends Document {
  companyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  shiftId?: mongoose.Types.ObjectId;
  loginTime?: Date;
  logoutTime?: Date;
  totalHours?: number;
  status: 'present' | 'absent' | 'half-day' | 'late' | 'Weekly Off' | 'Work From Home' | 'On Duty' | 'Restricted Holiday' | 'Leave' | 'Holiday';
  lateMinutes?: number;
}

const AttendanceSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    shiftId: { type: Schema.Types.ObjectId, ref: 'Shift' },
    loginTime: { type: Date },
    logoutTime: { type: Date },
    totalHours: { type: Number },
    status: { type: String, enum: ['present', 'absent', 'half-day', 'late', 'Weekly Off', 'Work From Home', 'On Duty', 'Restricted Holiday', 'Leave', 'Holiday'], required: true },
    lateMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index to ensure one attendance record per user per date
AttendanceSchema.index({ companyId: 1, userId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ companyId: 1 });

const Attendance: Model<IAttendance> = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export default Attendance;
