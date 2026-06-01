import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  shiftId?: mongoose.Types.ObjectId;
  loginTime?: Date;
  logoutTime?: Date;
  totalHours?: number;
  status: 'present' | 'absent' | 'half-day' | 'late';
  lateMinutes?: number;
}

const AttendanceSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    shiftId: { type: Schema.Types.ObjectId, ref: 'Shift' },
    loginTime: { type: Date },
    logoutTime: { type: Date },
    totalHours: { type: Number },
    status: { type: String, enum: ['present', 'absent', 'half-day', 'late'], required: true },
    lateMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index to ensure one attendance record per user per date
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const Attendance: Model<IAttendance> = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export default Attendance;
