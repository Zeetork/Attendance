import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e5e5',
    paddingBottom: 20,
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#171717',
  },
  month: {
    fontSize: 12,
    color: '#737373',
    marginTop: 4,
    fontWeight: 'bold',
  },
  companyDetails: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#171717',
  },
  companyAddress: {
    fontSize: 10,
    color: '#737373',
    marginTop: 4,
  },
  companyContact: {
    fontSize: 10,
    color: '#737373',
    marginTop: 2,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoBox: {
    width: '48%',
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  infoBoxTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#171717',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    width: '40%',
    fontSize: 10,
    color: '#737373',
  },
  infoValue: {
    width: '60%',
    fontSize: 10,
    color: '#171717',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 20,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e5e5e5',
  },
  statColLast: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: '#737373',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 14,
    color: '#171717',
    fontWeight: 'bold',
  },
  statValueGreen: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: 'bold',
  },
  statValueRed: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: 'bold',
  },
  statValuePink: {
    fontSize: 14,
    color: '#db2777',
    fontWeight: 'bold',
  },
  statValueBlue: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#171717',
  },
  tableHeaderCellRight: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#171717',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    color: '#171717',
  },
  tableCellRight: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    color: '#171717',
    textAlign: 'right',
  },
  tableCellRedRight: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    color: '#dc2626',
    textAlign: 'right',
  },
  tableFooter: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tableFooterCell: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#171717',
  },
  tableFooterCellRight: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#171717',
    textAlign: 'right',
  },
  tableFooterCellRedRight: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#dc2626',
    textAlign: 'right',
  },
  netSalaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginTop: 8,
  },
  netSalaryLabel: {
    fontSize: 14,
    color: '#1e3a8a',
    fontWeight: 'bold',
  },
  netSalaryValue: {
    fontSize: 24,
    color: '#1d4ed8',
    fontWeight: 'bold',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  signatureBox: {
    width: 150,
    borderTopWidth: 1,
    borderTopColor: '#d4d4d4',
    paddingTop: 8,
    alignItems: 'center',
  },
  signatureText: {
    fontSize: 10,
    color: '#737373',
    fontWeight: 'bold',
  }
});

interface PayslipProps {
  payroll: any;
  user: any;
  company: any;
}

export const PayslipDocument = ({ payroll, user, company }: PayslipProps) => {
  const monthName = format(new Date(payroll.year, payroll.month - 1), 'MMMM yyyy');
  
  const lossOfPay = ((payroll.deductionAmount ?? payroll.deductions) - (payroll.salaryDeductionsSnapshot?.esi || 0) - (payroll.salaryDeductionsSnapshot?.loan || 0));

  const formatCurrency = (val: number) => `Rs ${(val || 0).toLocaleString('en-IN')}`;

  const basicSalary = payroll.grossSalary || payroll.monthlySalary || 0;
  const totalDeductions = (payroll.deductionAmount ?? payroll.deductions) || 0;
  const netSalary = payroll.netSalary || payroll.finalSalary || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>PAYSLIP</Text>
            <Text style={styles.month}>{monthName}</Text>
          </View>
          <View style={styles.companyDetails}>
            <Text style={styles.companyName}>{company?.companyName || 'Company Name'}</Text>
            <Text style={styles.companyAddress}>{company?.address || 'Company Address'}</Text>
            <Text style={styles.companyContact}>{company?.email || 'email@company.com'} | {company?.phone || 'Phone'}</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Employee Details</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Employee ID:</Text>
              <Text style={styles.infoValue}>{user?.employeeId || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{user?.name || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Department:</Text>
              <Text style={styles.infoValue}>{user?.department || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Designation:</Text>
              <Text style={styles.infoValue}>{user?.designation || '-'}</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Bank Details</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Bank Name:</Text>
              <Text style={styles.infoValue}>{user?.bankName || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Account No:</Text>
              <Text style={styles.infoValue}>{user?.accountNumber || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>IFSC Code:</Text>
              <Text style={styles.infoValue}>{user?.ifscCode || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Calendar Days</Text>
            <Text style={styles.statValue}>{payroll.totalCalendarDays || '-'}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Working Days</Text>
            <Text style={styles.statValue}>{payroll.totalWorkingDays || 0}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Present</Text>
            <Text style={styles.statValueGreen}>{payroll.presentDays || 0}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Absent</Text>
            <Text style={styles.statValueRed}>{payroll.absentDays || 0}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Leave</Text>
            <Text style={styles.statValuePink}>{payroll.leaveDays || 0}</Text>
          </View>
          <View style={styles.statColLast}>
            <Text style={styles.statLabel}>Weekly Offs</Text>
            <Text style={styles.statValueBlue}>{payroll.weeklyOffDays || 0}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCell}>Earnings</Text>
            <Text style={styles.tableHeaderCellRight}>Amount</Text>
            <Text style={styles.tableHeaderCell}>Deductions</Text>
            <Text style={styles.tableHeaderCellRight}>Amount</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Basic Salary</Text>
            <Text style={styles.tableCellRight}>{formatCurrency(basicSalary)}</Text>
            <Text style={styles.tableCell}>Loss of Pay (Absent &amp; Leave)</Text>
            <Text style={styles.tableCellRedRight}>-{formatCurrency(lossOfPay)}</Text>
          </View>

          {!!payroll.salaryDeductionsSnapshot?.esi && (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}></Text>
              <Text style={styles.tableCellRight}></Text>
              <Text style={styles.tableCell}>ESI Deduction</Text>
              <Text style={styles.tableCellRedRight}>-{formatCurrency(payroll.salaryDeductionsSnapshot.esi)}</Text>
            </View>
          )}

          {!!payroll.salaryDeductionsSnapshot?.loan && (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}></Text>
              <Text style={styles.tableCellRight}></Text>
              <Text style={styles.tableCell}>Loan Repayment</Text>
              <Text style={styles.tableCellRedRight}>-{formatCurrency(payroll.salaryDeductionsSnapshot.loan)}</Text>
            </View>
          )}
          
          {(!payroll.salaryDeductionsSnapshot?.esi && !payroll.salaryDeductionsSnapshot?.loan) && (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}></Text>
              <Text style={styles.tableCellRight}></Text>
              <Text style={styles.tableCell}></Text>
              <Text style={styles.tableCellRight}></Text>
            </View>
          )}

          <View style={styles.tableFooter}>
            <Text style={styles.tableFooterCell}>Total Earnings</Text>
            <Text style={styles.tableFooterCellRight}>{formatCurrency(basicSalary)}</Text>
            <Text style={styles.tableFooterCell}>Total Deductions</Text>
            <Text style={styles.tableFooterCellRedRight}>-{formatCurrency(totalDeductions)}</Text>
          </View>
        </View>

        <View style={styles.netSalaryBox}>
          <Text style={styles.netSalaryLabel}>Net Salary Payable</Text>
          <Text style={styles.netSalaryValue}>{formatCurrency(netSalary)}</Text>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureText}>Employer Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureText}>Employee Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
