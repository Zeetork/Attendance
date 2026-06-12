
```
attendance
├─ README.md
├─ eslint.config.mjs
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ public
│  ├─ TF_logo.png
│  └─ TF_logo2.png
├─ query_db.js
├─ scripts
│  └─ fix-joining-dates.ts
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ attendance
│  │  │  │  ├─ AttendanceClient.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ calendar
│  │  │  │  └─ page.tsx
│  │  │  ├─ dashboard
│  │  │  │  ├─ DashboardClient.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ employees
│  │  │  │  ├─ EmployeeClient.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ layout.tsx
│  │  │  ├─ leaves
│  │  │  │  ├─ LeavesClient.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ organization
│  │  │  │  ├─ HierarchyBuilderClient.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ payroll
│  │  │  │  ├─ PayrollClient.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ profile
│  │  │  │  └─ page.tsx
│  │  │  ├─ reports
│  │  │  │  ├─ ReportsClient.tsx
│  │  │  │  └─ page.tsx
│  │  │  └─ settings
│  │  │     ├─ CalendarClient.tsx
│  │  │     ├─ page.tsx
│  │  │     └─ policies
│  │  │        ├─ PoliciesClient.tsx
│  │  │        └─ page.tsx
│  │  ├─ api
│  │  │  ├─ admin
│  │  │  │  ├─ attendance
│  │  │  │  │  ├─ [id]
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ dashboard
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ employees
│  │  │  │  │  ├─ [id]
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ holidays
│  │  │  │  │  ├─ [id]
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ leaves
│  │  │  │  │  ├─ [id]
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ payroll
│  │  │  │  │  ├─ payslip
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ send-email
│  │  │  │  │     └─ route.ts
│  │  │  │  └─ reports
│  │  │  │     └─ route.ts
│  │  │  ├─ approvals
│  │  │  │  ├─ action
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ attendance
│  │  │  │  ├─ check-in
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ check-out
│  │  │  │     └─ route.ts
│  │  │  ├─ auth
│  │  │  │  └─ [...nextauth]
│  │  │  │     └─ route.ts
│  │  │  ├─ calendar
│  │  │  │  └─ route.ts
│  │  │  ├─ cron
│  │  │  │  └─ attendance
│  │  │  │     └─ route.ts
│  │  │  ├─ employee
│  │  │  │  ├─ attendance
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ dashboard
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ leaves
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ payslips
│  │  │  │     └─ route.ts
│  │  │  ├─ hierarchy
│  │  │  │  ├─ reporting-chain
│  │  │  │  │  └─ [employeeId]
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ subordinates
│  │  │  │  │  └─ [employeeId]
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ team
│  │  │  │  │  └─ [managerId]
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ tree
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ update-manager
│  │  │  │     └─ route.ts
│  │  │  ├─ holidays
│  │  │  │  └─ route.ts
│  │  │  ├─ leaves
│  │  │  │  ├─ [id]
│  │  │  │  │  └─ approve
│  │  │  │  │     └─ route.ts
│  │  │  │  └─ apply
│  │  │  │     └─ route.ts
│  │  │  ├─ notifications
│  │  │  │  └─ route.ts
│  │  │  ├─ payroll
│  │  │  │  ├─ generate
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ payslip
│  │  │  │     └─ route.ts
│  │  │  ├─ profile
│  │  │  │  └─ route.ts
│  │  │  ├─ requests
│  │  │  │  └─ submit
│  │  │  │     └─ route.ts
│  │  │  ├─ settings
│  │  │  │  └─ policies
│  │  │  │     └─ route.ts
│  │  │  └─ shifts
│  │  │     └─ route.ts
│  │  ├─ employee
│  │  │  ├─ approvals
│  │  │  │  ├─ ApprovalClient.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ attendance
│  │  │  │  ├─ AttendanceClient.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ calendar
│  │  │  │  └─ page.tsx
│  │  │  ├─ dashboard
│  │  │  │  ├─ DashboardClient.tsx
│  │  │  │  ├─ ReportingStructure.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ layout.tsx
│  │  │  ├─ leaves
│  │  │  │  ├─ LeavesClient.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ payslips
│  │  │  │  ├─ PayslipsClient.tsx
│  │  │  │  └─ page.tsx
│  │  │  └─ profile
│  │  │     └─ page.tsx
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  └─ page.tsx
│  ├─ auth.config.ts
│  ├─ auth.ts
│  ├─ components
│  │  ├─ AttendanceButtons.tsx
│  │  ├─ AttendanceCalendar.tsx
│  │  ├─ DashboardLayoutClient.tsx
│  │  ├─ NotificationSlide.tsx
│  │  ├─ ProfileClient.tsx
│  │  ├─ Sidebar.tsx
│  │  └─ TopNav.tsx
│  ├─ hooks
│  ├─ lib
│  │  ├─ emailService.ts
│  │  └─ mongodb.ts
│  ├─ middleware.ts
│  ├─ models
│  │  ├─ ApprovalAuditLog.ts
│  │  ├─ Attendance.ts
│  │  ├─ AttendanceCorrection.ts
│  │  ├─ CompOffCredit.ts
│  │  ├─ EmployeeLeaveBalance.ts
│  │  ├─ Holiday.ts
│  │  ├─ Leave.ts
│  │  ├─ LeavePolicy.ts
│  │  ├─ MissPunch.ts
│  │  ├─ Notification.ts
│  │  ├─ OvertimeRequest.ts
│  │  ├─ Payroll.ts
│  │  ├─ Shift.ts
│  │  ├─ User.ts
│  │  └─ WFHRequest.ts
│  ├─ scripts
│  │  ├─ seed.ts
│  │  └─ seedHierarchy.ts
│  ├─ services
│  │  ├─ LeaveBalanceEngine.ts
│  │  └─ hierarchy.service.ts
│  ├─ types
│  │  ├─ global.d.ts
│  │  └─ next-auth.d.ts
│  ├─ utils
│  └─ validations
├─ step.txt
├─ steps.txt
└─ tsconfig.json

```