import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INotification extends Document {
  companyId: mongoose.Types.ObjectId;
  recipientId?: mongoose.Types.ObjectId; // if targeting a specific user
  targetRole?: 'admin' | 'director' | 'department_head' | 'manager' | 'team_head' | 'employee'; // if targeting all users with a specific role
  type: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: false },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User' },
    targetRole: { type: String, enum: ['admin', 'director', 'department_head', 'manager', 'team_head', 'employee'] },
    type: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

NotificationSchema.index({ companyId: 1 });

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
