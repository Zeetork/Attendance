import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAttendanceCorrection extends Document {
  companyId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  attendanceId: mongoose.Types.ObjectId;
  approverId: mongoose.Types.ObjectId;
  currentCheckIn?: Date;
  currentCheckOut?: Date;
  requestedCheckIn?: Date;
  requestedCheckOut?: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

const AttendanceCorrectionSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attendanceId: { type: Schema.Types.ObjectId, ref: 'Attendance', required: true },
    approverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    currentCheckIn: { type: Date },
    currentCheckOut: { type: Date },
    requestedCheckIn: { type: Date },
    requestedCheckOut: { type: Date },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

AttendanceCorrectionSchema.index({ companyId: 1 });

const AttendanceCorrection: Model<IAttendanceCorrection> = mongoose.models.AttendanceCorrection || mongoose.model<IAttendanceCorrection>('AttendanceCorrection', AttendanceCorrectionSchema);
export default AttendanceCorrection;
