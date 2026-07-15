import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPermission extends Document {
  companyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  fromTime: string; // HH:mm format
  toTime: string;   // HH:mm format
  duration: number; // in minutes
  reason: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Pending Compensation' | 'Partially Compensated' | 'Fully Compensated' | 'Cancelled';
  currentApprover?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  compensatedMinutes: number;
  pendingMinutes: number;
}

const PermissionSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    fromTime: { type: String, required: true },
    toTime: { type: String, required: true },
    duration: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['Pending Approval', 'Approved', 'Rejected', 'Pending Compensation', 'Partially Compensated', 'Fully Compensated', 'Cancelled'],
      default: 'Pending Approval'
    },
    currentApprover: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    compensatedMinutes: { type: Number, default: 0 },
    pendingMinutes: { type: Number, required: true } // Initially equals duration if approved
  },
  { timestamps: true }
);

PermissionSchema.index({ companyId: 1 });
PermissionSchema.index({ userId: 1, date: 1 });

const Permission: Model<IPermission> = mongoose.models.Permission || mongoose.model<IPermission>('Permission', PermissionSchema);
export default Permission;
