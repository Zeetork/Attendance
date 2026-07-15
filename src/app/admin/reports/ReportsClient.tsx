'use client';

import useSWR from 'swr';
import { Download, AlertCircle, CalendarDays, BarChart2 } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ReportsClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  
  const { data, error, isLoading } = useSWR(`/api/admin/reports?month=${month}&year=${year}`, fetcher);

  const handleExport = async () => {
    if (!data) return;

    const workbook = new ExcelJS.Workbook();

    // 1. Late Log Sheet
    // const sheet1 = workbook.addWorksheet('Late Coming Log');
    // sheet1.columns = [
    //   { header: 'Employee', key: 'employeeName', width: 20 },
    //   { header: 'Department', key: 'department', width: 20 },
    //   { header: 'Date', key: 'date', width: 15 },
    //   { header: 'Shift Start', key: 'shiftStart', width: 15 },
    //   { header: 'Actual Check-in', key: 'actualCheckIn', width: 20 },
    //   { header: 'Late By (Mins)', key: 'lateBy', width: 15 }
    // ];
    // data.lateLog.forEach((log: any) => {
    //   sheet1.addRow({
    //     ...log,
    //     date: new Date(log.date).toLocaleDateString(),
    //     actualCheckIn: log.actualCheckIn !== '-' ? new Date(log.actualCheckIn).toLocaleTimeString() : '-'
    //   });
    // });

    // 2. Matrix Sheet
    const sheet2 = workbook.addWorksheet('Monthly Matrix');
    const matrixColumns = [
      { header: 'Employee', key: 'employeeName', width: 20 },
      ...Array.from({ length: data.daysInMonth }, (_, i) => ({
        header: `${i + 1}`,
        key: `day_${i + 1}`,
        width: 10
      }))
    ];
    sheet2.columns = matrixColumns;
    data.monthlyData.forEach((emp: any) => {
      const rowData: any = { employeeName: emp.employeeName };
      for (let i = 1; i <= data.daysInMonth; i++) {
        rowData[`day_${i}`] = emp.matrix[i];
      }
      sheet2.addRow(rowData);
    });

    // 3. Summary Sheet
    const sheet3 = workbook.addWorksheet('Monthly Summary');
    sheet3.columns = [
      { header: 'Employee', key: 'employeeName', width: 20 },
      { header: 'Present', key: 'present', width: 10 },
      { header: 'Leave', key: 'leave', width: 10 },
      { header: 'Absent', key: 'absent', width: 10 },
      { header: 'Half Day', key: 'halfDay', width: 10 },
      { header: 'Late', key: 'late', width: 10 },
      { header: 'OT', key: 'ot', width: 10 }
    ];
    data.monthlyData.forEach((emp: any) => {
      sheet3.addRow({
        employeeName: emp.employeeName,
        ...emp.summary
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_Report_${format(currentDate, 'MMM_yyyy')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-card border border-border rounded-xl w-1/4"></div>
        <div className="h-96 bg-card border border-border rounded-2xl w-full"></div>
        <div className="h-96 bg-card border border-border rounded-2xl w-full"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive font-bold p-6 bg-destructive/10 rounded-xl">Failed to load report data.</div>;
  }

  const daysArray = Array.from({ length: data.daysInMonth }, (_, i) => i + 1);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/20 text-success text-xs font-bold" title="Present">P</span>;
      case 'late': return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-warning/20 text-warning text-xs font-bold" title="Late">L</span>;
      case 'absent': return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive/20 text-destructive text-xs font-bold" title="Absent">A</span>;
      case 'half-day': return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold" title="Half Day">HD</span>;
      case 'Leave': return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 text-xs font-bold" title="Leave">LV</span>;
      default: return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs" title="No Data">-</span>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance Reports</h1>
          <p className="text-sm font-bold text-muted-foreground mt-1">Detailed late arrivals and monthly attendance matrix for {format(currentDate, 'MMMM yyyy')}.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input 
            type="month" 
            value={`${year}-${String(month).padStart(2, '0')}`}
            onChange={(e) => {
              if (e.target.value) {
                const [y, m] = e.target.value.split('-');
                setCurrentDate(new Date(parseInt(y), parseInt(m) - 1, 1));
              }
            }}
            className="flex-1 sm:flex-none px-4 py-2 min-h-[44px] rounded-xl border border-border bg-card text-card-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          />
          <button
            onClick={handleExport}
            className="flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground min-h-[44px] rounded-xl hover:bg-primary/90 transition-colors shadow-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* 1. Late Coming Report Table */}
      {/* <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-3 bg-muted/30">
          <AlertCircle className="w-5 h-5 text-warning" />
          <h2 className="text-lg font-bold tracking-tight text-card-foreground">Late Coming Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 font-bold">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Shift Start</th>
                <th className="px-6 py-4">Actual Check-in</th>
                <th className="px-6 py-4">Late By</th>
              </tr>
            </thead>
            <tbody>
              {data.lateLog && data.lateLog.length > 0 ? (
                data.lateLog.map((log: any, idx: number) => (
                  <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">{log.employeeName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{log.department}</td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">{new Date(log.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-muted-foreground">{log.shiftStart}</td>
                    <td className="px-6 py-4 font-medium text-warning">
                      {log.actualCheckIn !== '-' ? new Date(log.actualCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-destructive">{log.lateBy} mins</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground font-bold">No late arrivals recorded this month.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div> */}

      {/* 2. Continuous Late Ratio / Monthly Matrix Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-3 bg-muted/30">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight text-card-foreground">Monthly Attendance Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 font-bold sticky top-0">
              <tr>
                <th className="px-6 py-4 bg-muted/50 sticky left-0 z-10 border-r border-border">Employee</th>
                {daysArray.map(day => (
                  <th key={day} className="px-2 py-4 text-center min-w-[40px]">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.monthlyData && data.monthlyData.map((emp: any, idx: number) => (
                <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 font-bold text-foreground bg-card sticky left-0 z-10 border-r border-border">
                    {emp.employeeName}
                  </td>
                  {daysArray.map(day => (
                    <td key={day} className="px-1 py-3 text-center">
                      {getStatusBadge(emp.matrix[day])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Monthly Attendance Summary Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-3 bg-muted/30">
          <BarChart2 className="w-5 h-5 text-success" />
          <h2 className="text-lg font-bold tracking-tight text-card-foreground">Monthly Attendance Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 font-bold">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4 text-center">Present</th>
                <th className="px-6 py-4 text-center">Leave</th>
                <th className="px-6 py-4 text-center">Absent</th>
                <th className="px-6 py-4 text-center">Half Day</th>
                <th className="px-6 py-4 text-center">Late</th>
                <th className="px-6 py-4 text-center">OT</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyData && data.monthlyData.map((emp: any, idx: number) => (
                <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground">{emp.employeeName}</td>
                  <td className="px-6 py-4 text-center font-bold text-success">{emp.summary.present}</td>
                  <td className="px-6 py-4 text-center font-bold text-purple-500">{emp.summary.leave}</td>
                  <td className="px-6 py-4 text-center font-bold text-destructive">{emp.summary.absent}</td>
                  <td className="px-6 py-4 text-center font-bold text-primary">{emp.summary.halfDay}</td>
                  <td className="px-6 py-4 text-center font-bold text-warning">{emp.summary.late}</td>
                  <td className="px-6 py-4 text-center font-bold text-muted-foreground">{emp.summary.ot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
