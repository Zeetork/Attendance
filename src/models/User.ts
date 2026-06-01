import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  employeeId: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'director' | 'department_head' | 'manager' | 'team_head' | 'employee';
  department: string;
  designation: string;
  reportsTo?: mongoose.Types.ObjectId | null;
  shiftId?: mongoose.Types.ObjectId;
  profileImage?: string;
  phoneNumber?: string;
  address?: string;
  emergencyContact?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  joiningDate: Date;
  monthlySalary: number;
  isActive: boolean;
}

const UserSchema: Schema = new Schema(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'director', 'department_head', 'manager', 'team_head', 'employee'], default: 'employee' },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    reportsTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    shiftId: { type: Schema.Types.ObjectId, ref: 'Shift' },
    profileImage: { type: String },
    phoneNumber: { type: String },
    address: { type: String },
    emergencyContact: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    joiningDate: { type: Date, required: true },
    monthlySalary: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
