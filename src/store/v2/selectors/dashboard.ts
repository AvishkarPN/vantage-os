import { useDatabaseStore } from '../databaseStore';

export const useLiveMetrics = () => {
  return useDatabaseStore((state) => {
    const zonesList = Object.values(state.zones);
    const incidentsList = Object.values(state.incidents);
    const recommendationsList = Object.values(state.recommendations);
    const sessionsList = Object.values(state.sessions);

    const totalAttendees = zonesList.reduce((sum, z) => sum + z.currentOccupancy, 0);
    const maxCapacity = zonesList.reduce((sum, z) => sum + z.capacity, 0);
    const overallOccupancyPct = maxCapacity > 0 ? Math.round((totalAttendees / maxCapacity) * 100) : 0;

    const activeCriticalAlerts = incidentsList.filter(i => i.status === 'ACTIVE' && i.severity === 'CRITICAL').length;
    const activeWarnings = incidentsList.filter(i => i.status === 'ACTIVE' && i.severity === 'WARNING').length;
    const activeAlertsCount = incidentsList.filter(i => i.status === 'ACTIVE').length;

    const delayedSessions = sessionsList.filter(s => s.status === 'DELAYED').length;
    const unresolvedRecommendations = recommendationsList.filter(r => r.status === 'PENDING').length;
    
    // Venue Health Score: 100 - (10 * active criticals) - (2 * active warnings)
    const venueHealthScore = Math.max(0, 100 - (activeCriticalAlerts * 10) - (activeWarnings * 2));

    return { 
      totalAttendees, 
      maxCapacity,
      overallOccupancyPct,
      activeAlertsCount,
      activeCriticalAlerts, 
      activeWarnings,
      delayedSessions,
      unresolvedRecommendations,
      venueHealthScore 
    };
  });
};

export const useStaffingMetrics = () => {
  return useDatabaseStore((state) => {
    const staffList = Object.values(state.staff);
    const zonesList = Object.values(state.zones);

    const totalStaff = staffList.length;
    const activeStaff = staffList.filter(s => s.status === 'ACTIVE').length;
    const unassignedActiveStaff = staffList.filter(s => s.status === 'ACTIVE' && s.assignedZoneId === null).length;

    const staffByZone = zonesList.reduce((acc, zone) => {
      acc[zone.id] = staffList.filter(s => s.assignedZoneId === zone.id).length;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalStaff,
      activeStaff,
      unassignedActiveStaff,
      staffByZone
    };
  });
};
