const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Payroll = require('./src/models/Payroll').default || require('./src/models/Payroll');
  const payrolls = await mongoose.model('Payroll').find().populate('userId').limit(2);
  console.log(JSON.stringify(payrolls, null, 2));
  process.exit(0);
});
