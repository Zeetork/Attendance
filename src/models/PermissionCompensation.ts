import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPermissionCompensation extends Document {
  permissionId: mongoose.Types.ObjectId;
  attendanceId: mongoose.Types.ObjectId;
  usedMinutes: number;
  createdBy: mongoose.Types.ObjectId; // employee who mapped it
}

const PermissionCompensationSchema: Schema = new Schema(
  {
    permissionId: { type: Schema.Types.ObjectId, ref: 'Permission', required: true },
    attendanceId: { type: Schema.Types.ObjectId, ref: 'Attendance', required: true },
    usedMinutes: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

PermissionCompensationSchema.index({ permissionId: 1 });
PermissionCompensationSchema.index({ attendanceId: 1 });

const PermissionCompensation: Model<IPermissionCompensation> = mongoose.models.PermissionCompensation || mongoose.model<IPermissionCompensation>('PermissionCompensation', PermissionCompensationSchema);
export default PermissionCompensation;
