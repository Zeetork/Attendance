import mongoose, { Document, Model, Schema } from 'mongoose';
import './Shift';
import './Company';
import './User';

export interface IAttendanceSession {
  sessionOrder: number;
  checkIn?: Date;
  checkOut?: Date;
  lateMinutes: number;
  status: 'Completed' | 'Late' | 'Missing Checkout' | 'Missed' | 'Pending';
}

export interface IAttendance extends Document {
  companyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  shiftId?: mongoose.Types.ObjectId;
  
  // New session-based structure
  sessions: IAttendanceSession[];
  
  // Legacy fields for backward compatibility
  loginTime?: Date;
  logoutTime?: Date;
  lateMinutes?: number;
  
  totalHours?: number;
  status: 'present' | 'absent' | 'half-day' | 'late' | 'Weekly Off' | 'Work From Home' | 'On Duty' | 'Restricted Holiday' | 'Leave' | 'Holiday';

  // Permission Compensation fields
  scheduledMinutes?: number;
  workedMinutes?: number;
  extraBeforeShiftMinutes?: number;
  extraAfterShiftMinutes?: number;
  totalExtraMinutes?: number;
  availableExtraMinutes?: number;
}

const AttendanceSessionSchema = new Schema({
  sessionOrder: { type: Number, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  lateMinutes: { type: Number, default: 0 },
  status: { type: String, enum: ['Completed', 'Late', 'Missing Checkout', 'Missed', 'Pending'] }
}, { _id: false });

const AttendanceSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    shiftId: { type: Schema.Types.ObjectId, ref: 'Shift' },
    
    sessions: { type: [AttendanceSessionSchema], default: [] },
    
    // Legacy fields
    loginTime: { type: Date },
    logoutTime: { type: Date },
    lateMinutes: { type: Number, default: 0 },
    
    totalHours: { type: Number },
    status: { type: String, enum: ['present', 'absent', 'half-day', 'late', 'Weekly Off', 'Work From Home', 'On Duty', 'Restricted Holiday', 'Leave', 'Holiday'], required: true },

    scheduledMinutes: { type: Number, default: 0 },
    workedMinutes: { type: Number, default: 0 },
    extraBeforeShiftMinutes: { type: Number, default: 0 },
    extraAfterShiftMinutes: { type: Number, default: 0 },
    totalExtraMinutes: { type: Number, default: 0 },
    availableExtraMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index to ensure one attendance record per user per date
AttendanceSchema.index({ companyId: 1, userId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ companyId: 1 });

const Attendance: Model<IAttendance> = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export default Attendance;
