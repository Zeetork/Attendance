import User from '@/models/User';
import mongoose from 'mongoose';

export class HierarchyService {
  // Get the full organization tree recursively
  static async getOrganizationTree() {
    const allUsers = await User.find({}).lean();
    
    // Map users by ID for quick lookup
    const userMap = new Map();
    const roots: any[] = [];
    
    allUsers.forEach((user: any) => {
      user.children = [];
      userMap.set(user._id.toString(), user);
    });
    
    allUsers.forEach((user: any) => {
      if (user.reportsTo) {
        const manager = userMap.get(user.reportsTo.toString());
        if (manager) {
          manager.children.push(user);
        } else {
          // Manager not found, treat as root or orphaned
          roots.push(user);
        }
      } else {
        roots.push(user);
      }
    });
    
    return roots;
  }

  // Update reporting manager
  static async updateManager(employeeId: string, reportsTo: string | null) {
    if (employeeId === reportsTo) {
      throw new Error('Employee cannot report to themselves.');
    }

    const employee = await User.findById(employeeId);
    if (!employee) throw new Error('Employee not found.');

    if (employee.role === 'admin' && reportsTo !== null) {
      throw new Error('Admin cannot report to anyone.');
    }

    if (reportsTo) {
      const manager = await User.findById(reportsTo);
      if (!manager) throw new Error('Manager not found.');
      
      // Check for circular dependency
      let currentManagerId = manager.reportsTo?.toString();
      while (currentManagerId) {
        if (currentManagerId === employeeId) {
          throw new Error('Circular reporting hierarchy detected.');
        }
        const nextManager = await User.findById(currentManagerId).select('reportsTo');
        currentManagerId = nextManager?.reportsTo?.toString();
      }
    }

    employee.reportsTo = reportsTo ? new mongoose.Types.ObjectId(reportsTo) : null;
    await employee.save();
    return employee;
  }
  
  // Get direct subordinates
  static async getDirectSubordinates(employeeId: string) {
    return User.find({ reportsTo: employeeId }).lean();
  }

  // Get full reporting chain (upwards)
  static async getReportingChain(employeeId: string) {
    const chain = [];
    let currentEmployeeId: string | undefined = employeeId;

    while (currentEmployeeId) {
      const currentEmployee = await User.findById(currentEmployeeId).select('reportsTo role name designation').lean() as any;
      if (!currentEmployee || !currentEmployee.reportsTo) {
        break;
      }
      const manager = await User.findById(currentEmployee.reportsTo).select('name role designation department').lean() as any;
      if (manager) {
        chain.push(manager);
        currentEmployeeId = manager._id.toString();
      } else {
        break;
      }
    }

    return chain;
  }

  // Get full team recursively (downwards)
  static async getTeamMembers(managerId: string) {
    const team: any[] = [];
    
    const fetchSubordinates = async (managerIdStr: string) => {
      const subs = await User.find({ reportsTo: managerIdStr }).lean();
      for (const sub of subs) {
        team.push(sub);
        await fetchSubordinates((sub as any)._id.toString());
      }
    };
    
    await fetchSubordinates(managerId);
    return team;
  }
}