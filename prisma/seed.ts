import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'dev.db')
const adapter = new PrismaLibSql({ url: `file:${dbPath.replace(/\\/g, '/')}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding VantageOS Production Persistence Layer...')

  // Clean existing operational data to allow clean re-seeding
  await prisma.recommendation.deleteMany()
  await prisma.incidentLog.deleteMany()
  await prisma.session.deleteMany()
  await prisma.resource.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.zone.deleteMany()
  await prisma.venue.deleteMany()
  await prisma.auditLog.deleteMany()

  // 1. Users
  const master = await prisma.user.upsert({
    where: { email: 'master@vantage.os' },
    update: {},
    create: {
      email: 'master@vantage.os',
      name: 'root_admin',
      role: 'ADMIN',
      password: 'argon2_hash_placeholder',
    },
  })

  const operator = await prisma.user.upsert({
    where: { email: 'operator@vantage.os' },
    update: {},
    create: {
      email: 'operator@vantage.os',
      name: 'op_alpha',
      role: 'OPERATOR',
      password: 'argon2_hash_placeholder',
    },
  })

  await prisma.user.upsert({
    where: { email: 'viewer@vantage.os' },
    update: {},
    create: {
      email: 'viewer@vantage.os',
      name: 'guest_viewer',
      role: 'READ_ONLY',
      password: 'argon2_hash_placeholder',
    },
  })

  // 2. Venue & Zones
  const venue = await prisma.venue.create({
    data: {
      name: 'Vantage Expo Center',
      location: 'Sector 7 Tactical Operations Center',
      capacity: 5000,
      healthScore: 100,
      zones: {
        create: [
          { name: 'Main Stage', capacity: 1500, currentOccupancy: 420, type: 'MAIN_STAGE', staffAssigned: 8, sessionCount: 3 },
          { name: 'Hall A', capacity: 300, currentOccupancy: 150, type: 'HALL', staffAssigned: 4, sessionCount: 5 },
          { name: 'Hall B', capacity: 120, currentOccupancy: 95, type: 'HALL', staffAssigned: 2, sessionCount: 4 },
          { name: 'Expo Floor', capacity: 800, currentOccupancy: 340, type: 'EXPO', staffAssigned: 6, sessionCount: 2 },
          { name: 'Gate 1-4', capacity: 500, currentOccupancy: 110, type: 'QUEUE', staffAssigned: 3, sessionCount: 0 },
          { name: 'Gate 5-8', capacity: 500, currentOccupancy: 90, type: 'QUEUE', staffAssigned: 3, sessionCount: 0 },
          { name: 'Control Desk', capacity: 50, currentOccupancy: 8, type: 'HALL', staffAssigned: 2, sessionCount: 0 },
          { name: 'Security', capacity: 100, currentOccupancy: 12, type: 'HALL', staffAssigned: 3, sessionCount: 0 },
          { name: 'Logistics', capacity: 100, currentOccupancy: 15, type: 'HALL', staffAssigned: 2, sessionCount: 0 },
          { name: 'Queue Management', capacity: 300, currentOccupancy: 45, type: 'QUEUE', staffAssigned: 2, sessionCount: 0 },
        ]
      }
    },
    include: { zones: true }
  })

  const zoneMap = new Map<string, string>()
  for (const z of venue.zones) {
    zoneMap.set(z.name, z.id)
  }

  // 3. Staff Roster (20 members)
  const staffList = [
    { id: 'S01', name: 'Priya Sharma', initials: 'PS', role: 'Senior Marshal', skills: JSON.stringify(['Crowd Control', 'First Aid']), shiftStart: '08:00', shiftEnd: '20:00', status: 'active', assignedZone: 'Hall A' },
    { id: 'S02', name: 'Rohan Mehta', initials: 'RM', role: 'Marshal', skills: JSON.stringify(['Crowd Control']), shiftStart: '09:00', shiftEnd: '21:00', status: 'active', assignedZone: 'Hall B' },
    { id: 'S03', name: 'Anita Desai', initials: 'AD', role: 'Technical Lead', skills: JSON.stringify(['AV', 'Lighting']), shiftStart: '07:00', shiftEnd: '19:00', status: 'active', assignedZone: 'Main Stage' },
    { id: 'S04', name: 'Vikram Patel', initials: 'VP', role: 'Marshal', skills: JSON.stringify(['Crowd Control']), shiftStart: '10:00', shiftEnd: '22:00', status: 'checked-in', assignedZone: null },
    { id: 'S05', name: 'Sanya Kapoor', initials: 'SK', role: 'Logistics Lead', skills: JSON.stringify(['Transport', 'Loading']), shiftStart: '07:00', shiftEnd: '19:00', status: 'active', assignedZone: 'Expo Floor' },
    { id: 'S06', name: 'Arjun Singh', initials: 'AS', role: 'Security', skills: JSON.stringify(['Access Control']), shiftStart: '08:00', shiftEnd: '20:00', status: 'active', assignedZone: 'Gate 1-4' },
    { id: 'S07', name: 'Meera Nair', initials: 'MN', role: 'Medical Officer', skills: JSON.stringify(['First Aid', 'CPR']), shiftStart: '08:00', shiftEnd: '20:00', status: 'active', assignedZone: 'Control Desk' },
    { id: 'S08', name: 'Ravi Kumar', initials: 'RK', role: 'Security', skills: JSON.stringify(['Access Control', 'Patrol']), shiftStart: '09:00', shiftEnd: '21:00', status: 'active', assignedZone: 'Security' },
    { id: 'S09', name: 'Divya Iyer', initials: 'DI', role: 'Coordinator', skills: JSON.stringify(['Scheduling', 'Comms']), shiftStart: '08:00', shiftEnd: '20:00', status: 'active', assignedZone: 'Control Desk' },
    { id: 'S10', name: 'Karan Shah', initials: 'KS', role: 'Marshal', skills: JSON.stringify(['Crowd Control']), shiftStart: '08:00', shiftEnd: '20:00', status: 'on-break', assignedZone: 'Hall A' },
    { id: 'S11', name: 'Pooja Gupta', initials: 'PG', role: 'Logistics', skills: JSON.stringify(['Transport']), shiftStart: '09:00', shiftEnd: '21:00', status: 'active', assignedZone: 'Logistics' },
    { id: 'S12', name: 'Suresh Naik', initials: 'SN', role: 'Technical AV', skills: JSON.stringify(['AV', 'Sound']), shiftStart: '07:00', shiftEnd: '19:00', status: 'active', assignedZone: 'Main Stage' },
    { id: 'S13', name: 'Aditi Rao', initials: 'AR', role: 'Marshal', skills: JSON.stringify(['Queue Management']), shiftStart: '10:00', shiftEnd: '22:00', status: 'active', assignedZone: 'Queue Management' },
    { id: 'S14', name: 'Nikhil Joshi', initials: 'NJ', role: 'Security', skills: JSON.stringify(['Access Control']), shiftStart: '08:00', shiftEnd: '20:00', status: 'active', assignedZone: 'Gate 5-8' },
    { id: 'S15', name: 'Priti Bose', initials: 'PB', role: 'Marshal', skills: JSON.stringify(['Crowd Control']), shiftStart: '12:00', shiftEnd: '24:00', status: 'unavailable', assignedZone: null },
    { id: 'S16', name: 'Manish Agarwal', initials: 'MA', role: 'Marshal', skills: JSON.stringify(['Crowd Control', 'First Aid']), shiftStart: '10:00', shiftEnd: '22:00', status: 'checked-in', assignedZone: null },
    { id: 'S17', name: 'Kavya Reddy', initials: 'KR', role: 'Medical Officer', skills: JSON.stringify(['First Aid', 'CPR']), shiftStart: '09:00', shiftEnd: '21:00', status: 'active', assignedZone: 'Expo Floor' },
    { id: 'S18', name: 'Rajesh Kumar', initials: 'RJ', role: 'Security', skills: JSON.stringify(['Access Control']), shiftStart: '08:00', shiftEnd: '20:00', status: 'active', assignedZone: 'Gate 1-4' },
    { id: 'S19', name: 'Sneha Pillai', initials: 'SP', role: 'Logistics', skills: JSON.stringify(['Inventory', 'Transport']), shiftStart: '07:00', shiftEnd: '19:00', status: 'active', assignedZone: 'Logistics' },
    { id: 'S20', name: 'Arun Menon', initials: 'AM', role: 'Technical', skills: JSON.stringify(['Lighting', 'Rigging']), shiftStart: '06:00', shiftEnd: '18:00', status: 'unassigned', assignedZone: null },
  ]

  for (const s of staffList) {
    const zoneId = s.assignedZone ? zoneMap.get(s.assignedZone) || null : null
    await prisma.staff.create({
      data: {
        id: s.id,
        name: s.name,
        initials: s.initials,
        role: s.role,
        skills: s.skills,
        shiftStart: s.shiftStart,
        shiftEnd: s.shiftEnd,
        status: s.status,
        assignedZone: s.assignedZone,
        zoneId: zoneId,
      }
    })
  }

  // 4. Resources (12 items)
  const resourceList = [
    { id: 'R01', name: 'Crowd Control Barriers', category: 'Barriers', required: 150, allocated: 120, zoneName: 'Gate 1-4', priority: 'critical', vendor: 'EventGuard Inc.', setupStatus: 'ready' },
    { id: 'R02', name: 'Handheld Scanners', category: 'Scanners', required: 24, allocated: 20, zoneName: 'Gate 5-8', priority: 'critical', vendor: 'TechRentals', setupStatus: 'ready' },
    { id: 'R03', name: 'Two-Way Radios (UHF)', category: 'Radios', required: 45, allocated: 45, zoneName: 'Global', priority: 'high', vendor: 'CommSys', setupStatus: 'ready' },
    { id: 'R04', name: 'Wayfinding Signage', category: 'Signage', required: 30, allocated: 30, zoneName: 'Hall B', priority: 'normal', vendor: 'PrintWorks', setupStatus: 'in-progress' },
    { id: 'R05', name: 'Folding Chairs', category: 'Chairs', required: 2000, allocated: 1500, zoneName: 'Main Stage', priority: 'normal', vendor: 'EventSeats', setupStatus: 'in-progress' },
    { id: 'R06', name: 'Hydration Stations', category: 'Water Stations', required: 12, allocated: 10, zoneName: 'Expo Floor', priority: 'high', vendor: 'AquaLife', setupStatus: 'pending' },
    { id: 'R07', name: 'Trauma Kits', category: 'Medical Kits', required: 5, allocated: 5, zoneName: 'Control Desk', priority: 'critical', vendor: 'MedSupply', setupStatus: 'ready' },
    { id: 'R08', name: 'Metal Detectors', category: 'Security Equipment', required: 8, allocated: 8, zoneName: 'Gate 1-4', priority: 'critical', vendor: 'SecureScan', setupStatus: 'ready' },
    { id: 'R09', name: 'Check-in Kiosks', category: 'Registration Desks', required: 16, allocated: 14, zoneName: 'Gate 5-8', priority: 'high', vendor: 'RegTech', setupStatus: 'pending' },
    { id: 'R10', name: 'LED Video Walls', category: 'AV Equipment', required: 4, allocated: 4, zoneName: 'Hall A', priority: 'high', vendor: 'VisuaLab', setupStatus: 'ready' },
    { id: 'R11', name: 'Queue Stanchions', category: 'Barriers', required: 80, allocated: 50, zoneName: 'Queue Management', priority: 'critical', vendor: 'EventGuard Inc.', setupStatus: 'in-progress' },
    { id: 'R12', name: 'Defibrillator (AED)', category: 'Medical Kits', required: 3, allocated: 2, zoneName: 'Main Stage', priority: 'critical', vendor: 'MedSupply', setupStatus: 'pending' },
  ]

  for (const r of resourceList) {
    const zoneId = r.zoneName !== 'Global' ? zoneMap.get(r.zoneName) || null : null
    await prisma.resource.create({
      data: {
        id: r.id,
        name: r.name,
        category: r.category,
        required: r.required,
        allocated: r.allocated,
        zoneName: r.zoneName,
        priority: r.priority,
        vendor: r.vendor,
        setupStatus: r.setupStatus,
        zoneId: zoneId,
      }
    })
  }

  // 5. Sessions
  const mainStageId = zoneMap.get('Main Stage')!
  const hallAId = zoneMap.get('Hall A')!
  const hallBId = zoneMap.get('Hall B')!
  const expoId = zoneMap.get('Expo Floor')!

  await prisma.session.createMany({
    data: [
      {
        id: 'SESS-101',
        zoneId: mainStageId,
        title: 'Keynote: Next-Gen Autonomous Event Operations',
        speakerName: 'Dr. Sarah Connor',
        speakerRole: 'Chief of Tactical Systems',
        speakerCompany: 'Cyberdyne Global',
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(Date.now() + 3600000),
        status: 'LIVE'
      },
      {
        id: 'SESS-102',
        zoneId: hallAId,
        title: 'Predictive Crowd Dynamics & Neural Redistribution',
        speakerName: 'Marcus Vance',
        speakerRole: 'Principal Architect',
        speakerCompany: 'Vantage Labs',
        startTime: new Date(Date.now() + 1800000),
        endTime: new Date(Date.now() + 5400000),
        status: 'SCHEDULED'
      },
      {
        id: 'SESS-103',
        zoneId: hallBId,
        title: 'Emergency Response & Active Crisis Protocol',
        speakerName: 'Elena Rostova',
        speakerRole: 'Director of Crisis Response',
        speakerCompany: 'Sentinel Dynamics',
        startTime: new Date(Date.now() + 7200000),
        endTime: new Date(Date.now() + 10800000),
        status: 'SCHEDULED'
      },
      {
        id: 'SESS-104',
        zoneId: expoId,
        title: 'Tactical Robotics & Edge Spatial Telemetry',
        speakerName: 'Devin Chen',
        speakerRole: 'Lead Hardware Engineer',
        speakerCompany: 'AeroTactics',
        startTime: new Date(Date.now() - 1800000),
        endTime: new Date(Date.now() + 7200000),
        status: 'LIVE'
      }
    ]
  })

  // 6. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: master.id,
      operatorName: master.name || 'root_admin',
      action: 'SYSTEM_INITIALIZATION: VantageOS Production Database Engine Synchronized',
      severity: 'LOW',
      status: 'SUCCESS'
    }
  })

  console.log('✅ Seeding complete: Users, Venues, Zones, Staff, Resources, Sessions, and Audit Logs seeded.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
