import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICompany extends Document {
  companyName: string;
  companyCode: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  status: boolean;
}

const CompanySchema: Schema = new Schema(
  {
    companyName: { type: String, required: true },
    companyCode: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    logo: { type: String },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Company: Model<ICompany> = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
export default Company;
