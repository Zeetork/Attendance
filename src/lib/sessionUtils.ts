import { IShiftSession } from '@/models/Shift';
import { IAttendanceSession } from '@/models/Attendance';

export function getActiveSessionInfo(
  sessions: IShiftSession[],
  attendanceSessions: IAttendanceSession[],
  currentTimeStr: string // "HH:mm"
) {
  if (!sessions || sessions.length === 0) {
    return {
      activeSession: null,
      nextSession: null,
      currentStatus: 'NO_SHIFT',
    };
  }

  const sortedSessions = [...sessions].sort((a, b) => a.order - b.order);

  let activeSession = null;
  let nextSession = null;
  let currentStatus = 'NO_ACTIVE_SESSION';
  let sessionState = null;

  // Determine active session sequentially based on attendance state
  for (let i = 0; i < sortedSessions.length; i++) {
    const s = sortedSessions[i];
    const attSession = attendanceSessions.find(a => a.sessionOrder === s.order);

    if (!attSession || !attSession.checkIn) {
      // Found the first session that hasn't been checked in yet
      activeSession = s;
      currentStatus = 'CAN_CHECK_IN';
      break;
    } else if (attSession.checkIn && !attSession.checkOut) {
      // Found a session that is currently active (checked in, but not checked out)
      activeSession = s;
      currentStatus = 'CAN_CHECK_OUT';
      sessionState = attSession;
      break;
    }
  }

  // Find next session if current is completed or null
  if (!activeSession) {
    currentStatus = 'ALL_COMPLETED';
  } else {
    const activeIndex = sortedSessions.findIndex(s => s.order === activeSession!.order);
    if (activeIndex >= 0 && activeIndex + 1 < sortedSessions.length) {
      nextSession = sortedSessions[activeIndex + 1];
    }
  }

  return {
    activeSession,
    nextSession,
    currentStatus,
    sessionState
  };
}
