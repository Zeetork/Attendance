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

  // Find active session
  let activeSession = null;
  let nextSession = null;
  let currentStatus = 'NO_ACTIVE_SESSION';

  for (let i = 0; i < sortedSessions.length; i++) {
    const s = sortedSessions[i];
    if (currentTimeStr >= s.startTime && currentTimeStr <= s.endTime) {
      activeSession = s;
      break;
    }
  }

  // If no active session, find the next one
  if (!activeSession) {
    for (let i = 0; i < sortedSessions.length; i++) {
      if (currentTimeStr < sortedSessions[i].startTime) {
        nextSession = sortedSessions[i];
        break;
      }
    }
  }

  let sessionState = null;
  if (activeSession) {
    const attSession = attendanceSessions.find(a => a.sessionOrder === activeSession!.order);
    if (!attSession || !attSession.checkIn) {
      currentStatus = 'CAN_CHECK_IN';
      sessionState = null;
    } else if (attSession.checkIn && !attSession.checkOut) {
      currentStatus = 'CAN_CHECK_OUT';
      sessionState = attSession;
    } else if (attSession.checkIn && attSession.checkOut) {
      currentStatus = 'COMPLETED';
      sessionState = attSession;
      
      // If completed this session, find the next one
      for (let i = 0; i < sortedSessions.length; i++) {
        if (currentTimeStr < sortedSessions[i].startTime) {
          nextSession = sortedSessions[i];
          break;
        }
      }
    }
  }

  return {
    activeSession,
    nextSession,
    currentStatus,
    sessionState
  };
}
