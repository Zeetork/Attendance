import { Schema, Document } from 'mongoose';
import { cookies } from 'next/headers';

export function multiTenantPlugin(schema: Schema) {
  const injectCompanyId = async function (this: any) {
    try {
      if (this.model && this.model.modelName === 'Company') return;

      const options = this.getOptions ? this.getOptions() : this.options;
      if (this.model && this.model.modelName === 'User') {
        console.log(`Plugin hook User Query. Options:`, options);
      }

      if (options && options.bypassTenant) {
        console.log('Bypassing tenant logic due to bypassTenant option');
        return;
      }

      const cookieStore = await cookies();
      const companyId = cookieStore.get('activeCompanyId')?.value;

      if (companyId) {
        if (this.model && this.model.modelName === 'User') {
          this.and([{ $or: [{ companyId }, { companyIds: companyId }] }]);
        } else {
          this.and([{ companyId }]);
        }
      }
    } catch (e) {
      // Ignored
    }
  };

  schema.pre('find', injectCompanyId);
  schema.pre('findOne', injectCompanyId);
  schema.pre('countDocuments', injectCompanyId);
  schema.pre('findOneAndUpdate', injectCompanyId);
  schema.pre('updateMany', injectCompanyId);
  schema.pre('updateOne', injectCompanyId);
  schema.pre('deleteMany', injectCompanyId);
  schema.pre('deleteOne', injectCompanyId);

  // Aggregations
  schema.pre('aggregate', async function (this: any) {
    try {
      if (this._model && this._model.modelName === 'Company') return;
      if (this.options && this.options.bypassTenant) return; // Note: Aggregate uses this.options

      const cookieStore = await cookies();
      const companyId = cookieStore.get('activeCompanyId')?.value;

      if (companyId) {
        if (this._model && this._model.modelName === 'User') {
          this.pipeline().unshift({ $match: { $or: [{ companyId: companyId }, { companyIds: companyId }] } });
        } else {
          this.pipeline().unshift({ $match: { companyId: companyId } });
        }
      }
    } catch (e) { }
  });

  // Saving (Create)
  schema.pre('save', async function (this: Document, options: any) {
    try {
      if (this.constructor.modelName === 'Company') return;
      if (options && options.bypassTenant) return;

      const cookieStore = await cookies();
      const companyId = cookieStore.get('activeCompanyId')?.value;

      if (companyId && !this.isModified('companyId')) {
        (this as any).companyId = companyId;

        if (this.constructor.modelName === 'User') {
          const arr = (this as any).companyIds || [];
          if (!arr.includes(companyId)) {
            arr.push(companyId);
            (this as any).companyIds = arr;
          }
        }
      }
    } catch (e) { }
  });
}
