import dbConnect from './src/lib/mongodb';
import Attendance from './src/models/Attendance';

async function fix() {
  await dbConnect();
  
  const res = await Attendance.updateMany(
    { 
      lateMinutes: { $gt: 0 }, 
      status: 'present' 
    },
    { $set: { status: 'late' } }
  );
  
  console.log('Fixed:', res);
  process.exit(0);
}
fix();
