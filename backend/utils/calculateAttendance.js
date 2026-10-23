const calculateAttendance = (records = []) => {
  if (!Array.isArray(records)) {
    throw new TypeError("Attendance records must be an array.");
  }

  const summary = {
    totalRecords: records.length,
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    holidays: 0,
    weeklyOff: 0,
    late: 0,
    totalWorkedHours: 0,
    attendancePercentage: 0,
  };

  for (const record of records) {
    const status = String(record.status || "").toLowerCase();

    switch (status) {
      case "present":
        summary.present++;
        break;
      case "absent":
        summary.absent++;
        break;
      case "half-day":
      case "halfday":
        summary.halfDay++;
        break;
      case "leave":
        summary.leave++;
        break;
      case "holiday":
        summary.holidays++;
        break;
      case "weekly-off":
      case "weeklyoff":
        summary.weeklyOff++;
        break;
      default:
        break;
    }

    if (record.isLate === true || record.late === true) {
      summary.late++;
    }

    const hours = Number(record.workedHours ?? record.totalHours ?? 0);

    if (Number.isFinite(hours) && hours > 0) {
      summary.totalWorkedHours += hours;
    }
  }

  // Holidays and weekly offs are excluded from scheduled working days.
  const workingDays =
    summary.present +
    summary.absent +
    summary.halfDay +
    summary.leave;

  if (workingDays > 0) {
    summary.attendancePercentage = Number(
      (((summary.present + summary.halfDay * 0.5) / workingDays) * 100).toFixed(2)
    );
  }

  summary.totalWorkedHours = Number(summary.totalWorkedHours.toFixed(2));

  return summary;
};

module.exports = calculateAttendance;
