
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
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ approvals
│  │  │  │  ├─ AdminApprovalClient.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ attendance
│  │  │  │  ├─ AttendanceClient.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ calendar
│  │  │  │  ├─ AttendanceCalendar.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ companies
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
│  │  │  ├─ letters
│  │  │  │  ├─ create
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ layout.tsx
│  │  │  │  ├─ logs
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ sent
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ templates
│  │  │  │     └─ page.tsx
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
│  │  │  ├─ settings
│  │  │  │  ├─ CalendarClient.tsx
│  │  │  │  └─ page.tsx
│  │  │  └─ shifts
│  │  │     ├─ ShiftsClient.tsx
│  │  │     └─ page.tsx
│  │  ├─ api
│  │  │  ├─ admin
│  │  │  │  ├─ approvals
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ attendance
│  │  │  │  │  ├─ [id]
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  ├─ override
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ calendar
│  │  │  │  │  └─ export
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ companies
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
│  │  │  ├─ companies
│  │  │  │  ├─ route.ts
│  │  │  │  └─ switch
│  │  │  │     └─ route.ts
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
│  │  │  ├─ letters
│  │  │  │  ├─ bulk-send
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ email-logs
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ employees
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ history
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ templates
│  │  │  │     ├─ [id]
│  │  │  │     │  └─ route.ts
│  │  │  │     └─ route.ts
│  │  │  ├─ notifications
│  │  │  │  ├─ route.ts
│  │  │  │  └─ subscribe
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
│  │  │  └─ shifts
│  │  │     ├─ [id]
│  │  │     │  └─ route.ts
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
│  │  ├─ CompanyProvider.tsx
│  │  ├─ CompanySwitcher.tsx
│  │  ├─ DashboardLayoutClient.tsx
│  │  ├─ NotificationSlide.tsx
│  │  ├─ ProfileClient.tsx
│  │  ├─ Sidebar.tsx
│  │  └─ TopNav.tsx
│  ├─ lib
│  │  ├─ bulkEmailService.ts
│  │  ├─ emailService.ts
│  │  ├─ mongodb.ts
│  │  ├─ multiTenantPlugin.ts
│  │  └─ pdfService.ts
│  ├─ middleware.ts
│  ├─ models
│  │  ├─ ApprovalAuditLog.ts
│  │  ├─ Attendance.ts
│  │  ├─ AttendanceCorrection.ts
│  │  ├─ CompOffCredit.ts
│  │  ├─ Company.ts
│  │  ├─ EmployeeLeaveBalance.ts
│  │  ├─ GeneratedLetter.ts
│  │  ├─ Holiday.ts
│  │  ├─ Leave.ts
│  │  ├─ LetterAuditLog.ts
│  │  ├─ LetterEmailLog.ts
│  │  ├─ LetterTemplate.ts
│  │  ├─ MissPunch.ts
│  │  ├─ Notification.ts
│  │  ├─ OvertimeRequest.ts
│  │  ├─ Payroll.ts
│  │  ├─ Shift.ts
│  │  ├─ SystemAuditLog.ts
│  │  ├─ User.ts
│  │  └─ WFHRequest.ts
│  ├─ pages
│  │  └─ api
│  │     └─ socket
│  ├─ scripts
│  │  └─ seed.ts
│  ├─ services
│  │  ├─ LeaveBalanceEngine.ts
│  │  └─ hierarchy.service.ts
│  └─ types
│     ├─ global.d.ts
│     └─ next-auth.d.ts
└─ tsconfig.json

```