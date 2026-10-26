import { v4 as uuidv4 } from 'uuid';

/* ------------------------------------------------------------------ *
 *  AGAC (Al Gurg Automation) - EIC project lifecycle knowledge base   *
 *  Phases, step library, sector templates, vendors and audit rules.   *
 * ------------------------------------------------------------------ */

export const COMPANY = {
  name: 'Al Gurg Automation (AGAC)',
  short: 'AGAC',
  web: 'www.agac.ae',
  address: 'Jebel Ali, Dubai, United Arab Emirates',
};

export const PHASES = [
  { id: 'feed', label: 'Planning & FEED', color: '#a78bfa' },
  { id: 'design', label: 'Design & Engineering', color: '#60a5fa' },
  { id: 'software', label: 'PLC / DCS / SCADA Development', color: '#22d3ee' },
  { id: 'fat', label: 'Factory Acceptance Test (FAT)', color: '#34d399' },
  { id: 'install', label: 'Installation & Pre-Commissioning', color: '#facc15' },
  { id: 'sat', label: 'Site Acceptance Test (SAT)', color: '#fb923c' },
  { id: 'commissioning', label: 'Commissioning', color: '#f5a524' },
  { id: 'handover', label: 'Handover & Closeout', color: '#f472b6' },
];

export const phaseById = (id) => PHASES.find((p) => p.id === id) || PHASES[0];

export const VENDORS = [
  { id: 'siemens', name: 'Siemens', platforms: 'SIMATIC S7-1500, WinCC / WinCC Unified, SIMATIC PCS 7, TIA Portal, SIPROTEC' },
  { id: 'schneider', name: 'Schneider Electric', platforms: 'Modicon M580, EcoStruxure Foxboro DCS, Citect SCADA / AVEVA, EcoStruxure Power' },
  { id: 'rockwell', name: 'Rockwell Automation', platforms: 'ControlLogix / CompactLogix, FactoryTalk View, PlantPAx DCS, Studio 5000' },
  { id: 'abb', name: 'ABB', platforms: 'AC800M, ABB Ability System 800xA, Symphony Plus, REF615 / RET615 relays' },
  { id: 'ge', name: 'GE Vernova / GE Digital', platforms: 'Proficy iFIX, Proficy CIMPLICITY, Mark VIe, Multilin relays' },
];

export const NETWORK_PROTOCOLS = [
  'Profinet',
  'Profibus DP',
  'Modbus TCP',
  'Modbus RTU',
  'EtherNet/IP',
  'IEC 61850 (MMS / GOOSE)',
  'IEC 60870-5-104',
  'DNP3',
  'OPC UA',
  'HART',
  'Foundation Fieldbus',
  'BACnet/IP',
];

export const NETWORK_TOPOLOGIES = ['Redundant ring', 'Star', 'Line', 'Dual star (A/B)', 'PRP / HSR'];

export const STANDARDS = {
  'IEC 61131-3': 'Programmable controllers - programming languages',
  'IEC 61511': 'Functional safety - SIS for the process industry',
  'IEC 61508': 'Functional safety of E/E/PE safety-related systems',
  'IEC 62443': 'Industrial automation and control systems cybersecurity',
  'IEC 61850': 'Communication networks and systems for power utility automation',
  'IEC 62381': 'Automation systems - FAT, SAT and SIT',
  'IEC 61439': 'Low-voltage switchgear and controlgear assemblies',
  'IEC 60079': 'Explosive atmospheres',
  'ISA-5.1': 'Instrumentation symbols and identification',
  'ISA-18.2': 'Management of alarm systems',
  'ISA-101': 'Human machine interfaces for process automation',
  'ISA-88': 'Batch control',
  'ISA-84': 'Safety instrumented systems',
  'ASHRAE Guideline 1.1': 'HVAC&R technical requirements for the commissioning process',
};

/* ------------------------------------------------------------------ *
 *  Step library                                                       *
 * ------------------------------------------------------------------ */

const std = (...s) => s;

export const STEP_LIBRARY = [
  // ---------------- Planning & FEED ----------------
  {
    key: 'feed_review',
    name: 'FEED Package & Scope Review',
    phase: 'feed',
    description:
      'Review the front-end engineering design package, scope of supply, battery limits, vendor interfaces and project schedule. Confirm automation philosophy and control system architecture basis.',
    standards: std('IEC 62381'),
    checklist: ['FEED documents received and revision-controlled', 'Battery limits and interfaces agreed', 'Automation philosophy approved', 'Project schedule and milestones baselined'],
  },
  {
    key: 'urs',
    name: 'User Requirement Specification (URS) & Functional Design Spec',
    phase: 'feed',
    description:
      'Capture operational requirements, control philosophy, operating modes, reporting needs and generate the Functional Design Specification (FDS) for client approval.',
    standards: std('IEC 62381', 'ISA-101'),
    checklist: ['URS signed off by client', 'FDS issued for approval', 'Operating modes defined (Auto/Manual/Maintenance)', 'Reporting and historian requirements captured'],
  },
  {
    key: 'hazop_sil',
    name: 'HAZOP / SIL Assessment Review',
    phase: 'feed',
    description:
      'Incorporate HAZOP actions and SIL determination results into the control and safety system design. Identify safety instrumented functions (SIFs) and required SIL levels.',
    standards: std('IEC 61511', 'IEC 61508', 'ISA-84'),
    checklist: ['HAZOP actions closed or tracked', 'SIL targets assigned to each SIF', 'SIL verification calculations received', 'Safety requirement specification (SRS) approved'],
  },

  // ---------------- Design & Engineering ----------------
  {
    key: 'p_id_review',
    name: 'P&ID / Process Flow Review',
    phase: 'design',
    description: 'Review P&IDs to identify all instruments, valves, drives and control loops required for the I/O schedule.',
    standards: std('ISA-5.1'),
    checklist: ['Latest P&ID revision confirmed', 'Control loops identified', 'Instrument and valve types confirmed', 'Hazardous area classification noted'],
  },
  {
    key: 'tag_naming',
    name: 'Tag Naming Convention & Instrument Index',
    phase: 'design',
    description:
      'Establish project tag naming convention (ISA-5.1 based) and issue the instrument index. Align naming across PLC, SCADA, historian and alarm database.',
    standards: std('ISA-5.1'),
    checklist: ['Naming convention document issued', 'Instrument index complete', 'Tag format agreed with client', 'Tags consistent across PLC / SCADA / P&ID'],
  },
  {
    key: 'io_list',
    name: 'I/O List & Signal Mapping',
    phase: 'design',
    description:
      'Develop the I/O schedule: signal type, range, engineering units, wiring, address, alarm limits and fail-safe state for every field signal.',
    standards: std('ISA-5.1', 'IEC 61131-3'),
    checklist: ['All signals listed with type and range', 'Engineering units and scaling defined', 'Spare capacity (min. 20%) confirmed', 'I/O list approved by client'],
  },
  {
    key: 'cause_effect',
    name: 'Cause & Effect Matrix',
    phase: 'design',
    description: 'Define the cause-and-effect relationships for alarms, trips, interlocks and emergency shutdowns, including voting logic and bypass philosophy.',
    standards: std('IEC 61511', 'ISA-18.2'),
    checklist: ['Causes and effects tabulated', 'Voting logic (1oo2 / 2oo3) defined', 'Bypass / override philosophy approved', 'Matrix reviewed by process and safety'],
  },
  {
    key: 'network_arch',
    name: 'Network Architecture Design',
    phase: 'design',
    description:
      'Design the control network: fieldbus and Ethernet topology, redundancy, IP addressing, VLANs, time synchronisation and interfaces to third-party systems.',
    standards: std('IEC 62443', 'IEC 61850'),
    checklist: ['Network topology diagram issued', 'IP addressing scheme approved', 'Redundancy method defined', 'Third-party interface list agreed'],
  },
  {
    key: 'panel_design',
    name: 'Control Panel & Cabinet Design',
    phase: 'design',
    description: 'Design PLC/RTU/marshalling panels: layout, power distribution, earthing, segregation, heat load and cable schedules.',
    standards: std('IEC 61439', 'IEC 60079'),
    checklist: ['GA and layout drawings approved', 'Heat load calculation done', 'Cable schedule issued', 'Earthing and surge protection detailed'],
  },
  {
    key: 'cybersecurity',
    name: 'Cybersecurity Design & Zoning',
    phase: 'design',
    description: 'Define security zones and conduits, user roles, patching, backup/restore and remote access policy for the control system.',
    standards: std('IEC 62443'),
    checklist: ['Zones and conduits documented', 'Role-based access defined', 'Hardening guideline applied', 'Backup and restore procedure agreed'],
  },

  // ---------------- Software Development ----------------
  {
    key: 'plc_programming',
    name: 'PLC / DCS Application Programming',
    phase: 'software',
    description: 'Develop control logic per the FDS using IEC 61131-3 languages: device blocks, sequences, PID loops, modes and diagnostics.',
    standards: std('IEC 61131-3'),
    checklist: ['Code follows AGAC programming standard', 'Standard function blocks reused', 'Version control baseline created', 'Peer code review completed'],
  },
  {
    key: 'interlock_logic',
    name: 'Interlock & Permissive Logic Implementation',
    phase: 'software',
    description: 'Implement and document interlocks, permissives, trips and shutdown logic from the cause & effect matrix.',
    standards: std('IEC 61511', 'IEC 61131-3'),
    checklist: ['All C&E rows implemented', 'Trip set-points match C&E', 'Bypass logic key-controlled and logged', 'Interlock test procedure prepared'],
  },
  {
    key: 'scada_development',
    name: 'SCADA / HMI Development',
    phase: 'software',
    description: 'Build SCADA screens, faceplates, trends, reports and security model following the approved HMI philosophy and tag database.',
    standards: std('ISA-101', 'IEC 62443'),
    checklist: ['Screen hierarchy approved', 'Faceplates standardised', 'Trends and historian configured', 'User roles configured'],
  },
  {
    key: 'alarm_rationalization',
    name: 'Alarm Rationalisation',
    phase: 'software',
    description: 'Rationalise alarm priorities, set-points, deadbands and delays. Document consequence, operator response and response time.',
    standards: std('ISA-18.2'),
    checklist: ['Alarm philosophy approved', 'Priorities distribution reviewed', 'Deadbands and delays defined', 'Alarm database frozen'],
  },
  {
    key: 'energy_metering',
    name: 'Energy / BTU Metering & Billing Integration',
    phase: 'software',
    description: 'Integrate chilled-water BTU meters and power meters (Modbus / M-Bus) for plant efficiency (kW/TR) calculation and customer billing.',
    standards: std('ASHRAE Guideline 1.1'),
    checklist: ['Meter registers mapped', 'kW/TR calculation validated', 'Billing data export tested', 'Meter calibration certificates filed'],
  },
  {
    key: 'batch_isa88',
    name: 'Batch / Recipe Management (ISA-88)',
    phase: 'software',
    description: 'Implement recipe, phase and unit procedure models per ISA-88 including batch reports and audit trail.',
    standards: std('ISA-88'),
    checklist: ['Physical and procedural model approved', 'Recipes configured and versioned', 'Batch reports validated', 'Audit trail enabled'],
  },

  // ---------------- FAT ----------------
  {
    key: 'fat_prep',
    name: 'FAT Procedure & Simulation Setup',
    phase: 'fat',
    description: 'Prepare the FAT procedure, test cases and simulation environment (I/O simulators, soft PLC, virtual plant).',
    standards: std('IEC 62381'),
    checklist: ['FAT procedure approved by client', 'Test equipment calibrated', 'Simulation setup verified', 'Witness invitations issued'],
  },
  {
    key: 'fat',
    name: 'Factory Acceptance Test (FAT)',
    phase: 'fat',
    description: 'Execute the FAT with client witnesses: hardware inspection, I/O test, functional logic, HMI, alarms, interlocks, redundancy and communications.',
    standards: std('IEC 62381'),
    checklist: ['Hardware inspection and insulation tests passed', 'I/O test 100% completed', 'Functional and interlock tests passed', 'Punch list issued and FAT certificate signed'],
  },

  // ---------------- Installation ----------------
  {
    key: 'installation',
    name: 'Field Installation Verification',
    phase: 'install',
    description: 'Verify installation of instruments, junction boxes, cable trays, panels and glands against approved drawings and hazardous-area requirements.',
    standards: std('IEC 60079', 'IEC 61439'),
    checklist: ['Installation per approved drawings', 'Hazardous area equipment verified', 'Tagging and labelling complete', 'Ingress protection and glanding checked'],
  },
  {
    key: 'cable_megger',
    name: 'Cable Continuity & Insulation (Megger) Tests',
    phase: 'install',
    description: 'Perform continuity, insulation resistance and earthing tests on field and power cables before energisation.',
    standards: std('IEC 61439'),
    checklist: ['Continuity tests recorded', 'Insulation resistance meets spec', 'Earth resistance verified', 'Test certificates filed'],
  },
  {
    key: 'instrument_calibration',
    name: 'Instrument Calibration',
    phase: 'install',
    description: 'Calibrate transmitters, analysers, switches and valves positioners using traceable equipment. Record as-found / as-left values.',
    standards: std('ISA-5.1'),
    checklist: ['Calibrator certificates valid', 'As-found / as-left recorded', 'Calibration stickers applied', 'HART / device configuration saved'],
  },
  {
    key: 'loop_check',
    name: 'Loop Checks (Field to HMI)',
    phase: 'install',
    description: 'Verify every instrument loop end-to-end: field device, wiring, I/O channel, scaling, alarm limits and HMI indication.',
    standards: std('ISA-5.1', 'IEC 62381'),
    checklist: ['Test points 0 / 25 / 50 / 75 / 100% verified', 'Scaling and units correct on HMI', 'Alarm limits confirmed', 'Loop sheets signed by client'],
  },
  {
    key: 'esd_verification',
    name: 'ESD / SIS Interlock Verification',
    phase: 'install',
    description: 'Verify emergency shutdown and safety instrumented functions: sensor-to-final-element tests, response times, voting and bypass.',
    standards: std('IEC 61511', 'ISA-84'),
    checklist: ['Every SIF tested sensor to final element', 'Response times measured', 'Bypass logging verified', 'Proof test procedure handed over'],
  },
  {
    key: 'protection_relay_test',
    name: 'Protection Relay Settings & Secondary Injection Tests',
    phase: 'install',
    description: 'Apply relay settings from the protection coordination study and perform secondary injection testing for each protection function.',
    standards: std('IEC 61850'),
    checklist: ['Settings match coordination study', 'Secondary injection tests recorded', 'Trip circuits and CT/VT wiring checked', 'Relay configuration files archived'],
  },
  {
    key: 'iec61850_comm_test',
    name: 'IEC 61850 GOOSE / MMS Communication Test',
    phase: 'install',
    description: 'Verify IEC 61850 engineering (SCD / CID files), GOOSE interlocking, MMS reporting and time synchronisation between IEDs, gateway and SCADA.',
    standards: std('IEC 61850'),
    checklist: ['SCD file consistent with IED configs', 'GOOSE subscriptions verified', 'Reporting to SCADA tested', 'Time synchronisation accurate'],
  },
  {
    key: 'cip_validation',
    name: 'CIP / SIP & Hygienic Process Validation',
    phase: 'install',
    description: 'Validate clean-in-place and sterilise-in-place sequences, temperature/flow/conductivity criteria and diversion valve logic.',
    standards: std('ISA-88'),
    checklist: ['CIP recipes verified', 'Temperature and conductivity limits validated', 'Diversion valves tested', 'Records electronically signed'],
  },

  // ---------------- SAT ----------------
  {
    key: 'sat',
    name: 'Site Acceptance Test (SAT)',
    phase: 'sat',
    description: 'Execute SAT on site with the final field connections: I/O, sequences, interlocks, communications to third-party systems, redundancy and HMI.',
    standards: std('IEC 62381'),
    checklist: ['SAT procedure approved', 'Field I/O verified live', 'Third-party interfaces tested', 'SAT punch list closed or agreed'],
  },

  // ---------------- Commissioning ----------------
  {
    key: 'cold_commissioning',
    name: 'Cold (Dry) Commissioning',
    phase: 'commissioning',
    description: 'Run non-process commissioning: rotation checks, valve strokes, interlock simulation and sequence dry-runs without process fluid or product.',
    standards: std('IEC 62381', 'ASHRAE Guideline 1.1'),
    checklist: ['Pre-commissioning checklist closed', 'Motor rotation and valve stroke verified', 'Sequences dry-run', 'Safe-to-start permit issued'],
  },
  {
    key: 'hot_commissioning',
    name: 'Hot (Live) Commissioning',
    phase: 'commissioning',
    description: 'Introduce process fluid/energy, tune PID loops, verify sequences under load and demonstrate stable operation.',
    standards: std('IEC 62381', 'ASHRAE Guideline 1.1'),
    checklist: ['Permit to start-up approved', 'Loops tuned and recorded', 'Sequences proven under load', 'Alarm behaviour verified live'],
  },
  {
    key: 'performance_test',
    name: 'Performance & Reliability Test',
    phase: 'commissioning',
    description: 'Run the plant through the specified performance period (e.g. 72-hour reliability run) and demonstrate guaranteed figures.',
    standards: std('ASHRAE Guideline 1.1'),
    checklist: ['Performance criteria defined in contract', 'Continuous run completed', 'Trends and reports captured', 'Performance certificate signed'],
  },

  // ---------------- Handover ----------------
  {
    key: 'training',
    name: 'Operator & Maintenance Training',
    phase: 'handover',
    description: 'Deliver classroom and on-site training to operators and maintenance staff including SCADA operation, alarms, backup and fault finding.',
    standards: std('ISA-101'),
    checklist: ['Training material approved', 'Attendance records signed', 'Operator competence confirmed', 'Quick reference guides issued'],
  },
  {
    key: 'as_built',
    name: 'As-Built Documentation & Software Backup',
    phase: 'handover',
    description: 'Issue as-built drawings, loop sheets, I/O list, final source code and configuration backups with checksums.',
    standards: std('IEC 62381', 'IEC 62443'),
    checklist: ['As-built drawings issued', 'Final software backup with checksum', 'Configuration databases archived', 'O&M manuals delivered'],
  },
  {
    key: 'handover',
    name: 'Project Handover & Closeout',
    phase: 'handover',
    description: 'Formal handover to the client: completion certificate, punch list closure, spares, warranty start and lessons learned.',
    standards: std('IEC 62381'),
    checklist: ['Completion certificate signed', 'Punch list closed', 'Spares and tools handed over', 'Warranty period started'],
  },
];

export const stepDef = (key) => STEP_LIBRARY.find((s) => s.key === key);

/* ------------------------------------------------------------------ *
 *  Sample I/O + interlock helpers                                      *
 * ------------------------------------------------------------------ */

const io = (tag, description, type, min, max, units, address) => ({
  id: uuidv4(),
  tag,
  description,
  type,
  min,
  max,
  units,
  address,
});

// op: '>' | '<' | '==' ; action: 'ALARM' | 'TRIP' | 'ESD'
const il = (tag, op, value, action, description) => ({
  id: uuidv4(),
  tag,
  op,
  value,
  action,
  description,
});

/* ------------------------------------------------------------------ *
 *  Sector templates                                                   *
 * ------------------------------------------------------------------ */

export const SECTORS = [
  {
    id: 'district_cooling',
    name: 'District Cooling Plants',
    icon: 'Snowflake',
    summary: 'Chiller plants, CHW / CW pumping, thermal storage, ETS and BTU metering.',
    vendors: ['siemens', 'schneider', 'abb'],
    protocols: ['Modbus TCP', 'BACnet/IP', 'Profinet'],
    standards: ['ASHRAE Guideline 1.1', 'IEC 61131-3', 'IEC 62443', 'ISA-18.2'],
    steps: [
      'feed_review', 'urs', 'p_id_review', 'tag_naming', 'io_list', 'cause_effect', 'network_arch', 'panel_design', 'cybersecurity',
      'plc_programming', 'interlock_logic', 'scada_development', 'alarm_rationalization', 'energy_metering',
      'fat_prep', 'fat',
      'installation', 'cable_megger', 'instrument_calibration', 'loop_check',
      'sat', 'cold_commissioning', 'hot_commissioning', 'performance_test',
      'training', 'as_built', 'handover',
    ],
    network: { protocol: 'Modbus TCP', topology: 'Redundant ring', redundancy: 'MRP / RSTP' },
    samples: {
      io: () => [
        io('TT-101', 'CHW supply temperature', 'AI', 0, 20, '°C', 'IW64'),
        io('TT-102', 'CHW return temperature', 'AI', 0, 20, '°C', 'IW66'),
        io('FT-101', 'CHW header flow', 'AI', 0, 3000, 'm³/h', 'IW68'),
        io('PT-101', 'CHW differential pressure', 'AI', 0, 6, 'bar', 'IW70'),
        io('YS-101', 'Chiller CH-01 running status', 'DI', 0, 1, '', 'I0.0'),
        io('HS-101', 'CHW pump P-101 run command', 'DO', 0, 1, '', 'Q0.0'),
      ],
      interlocks: () => [
        il('FT-101', '<', 300, 'TRIP', 'Low CHW flow - trip chiller CH-01 to protect evaporator from freezing'),
        il('TT-101', '>', 8, 'ALARM', 'High CHW supply temperature - plant not meeting set-point'),
      ],
    },
  },
  {
    id: 'oil_gas',
    name: 'Oil & Gas',
    icon: 'Flame',
    summary: 'Wellhead, separation, compression and pipeline facilities with SIS / ESD.',
    vendors: ['siemens', 'rockwell', 'abb', 'ge'],
    protocols: ['Modbus RTU', 'HART', 'Profibus DP', 'OPC UA'],
    standards: ['IEC 61511', 'IEC 61508', 'IEC 60079', 'ISA-84', 'ISA-18.2'],
    steps: [
      'feed_review', 'urs', 'hazop_sil', 'p_id_review', 'tag_naming', 'io_list', 'cause_effect', 'network_arch', 'panel_design', 'cybersecurity',
      'plc_programming', 'interlock_logic', 'scada_development', 'alarm_rationalization',
      'fat_prep', 'fat',
      'installation', 'cable_megger', 'instrument_calibration', 'loop_check', 'esd_verification',
      'sat', 'cold_commissioning', 'hot_commissioning', 'performance_test',
      'training', 'as_built', 'handover',
    ],
    network: { protocol: 'Modbus RTU', topology: 'Dual star (A/B)', redundancy: 'Redundant controllers & networks' },
    samples: {
      io: () => [
        io('PT-201', 'Separator V-201 pressure', 'AI', 0, 100, 'barg', 'IW100'),
        io('LT-201', 'Separator V-201 level', 'AI', 0, 100, '%', 'IW102'),
        io('TT-201', 'Separator V-201 temperature', 'AI', 0, 150, '°C', 'IW104'),
        io('AT-201', 'Gas detector area A', 'AI', 0, 100, '%LEL', 'IW106'),
        io('HS-201', 'ESD pushbutton - control room', 'DI', 0, 1, '', 'I1.0'),
        io('XV-201', 'Inlet shutdown valve command', 'DO', 0, 1, '', 'Q1.0'),
      ],
      interlocks: () => [
        il('PT-201', '>', 85, 'ESD', 'PAHH - separator overpressure, close inlet shutdown valve XV-201'),
        il('LT-201', '<', 10, 'TRIP', 'LALL - separator low-low level, trip liquid outlet pump'),
        il('AT-201', '>', 40, 'ESD', 'Gas detection 2oo3 at 40 %LEL - initiate area ESD'),
      ],
    },
  },
  {
    id: 'water',
    name: 'Water & Wastewater Infrastructure',
    icon: 'Droplets',
    summary: 'Pump stations, reservoirs, treatment plants and distribution networks.',
    vendors: ['schneider', 'siemens', 'rockwell'],
    protocols: ['Modbus TCP', 'DNP3', 'IEC 60870-5-104', 'OPC UA'],
    standards: ['IEC 62443', 'ISA-18.2', 'ISA-101', 'IEC 61131-3'],
    steps: [
      'feed_review', 'urs', 'p_id_review', 'tag_naming', 'io_list', 'cause_effect', 'network_arch', 'panel_design', 'cybersecurity',
      'plc_programming', 'interlock_logic', 'scada_development', 'alarm_rationalization',
      'fat_prep', 'fat',
      'installation', 'cable_megger', 'instrument_calibration', 'loop_check',
      'sat', 'cold_commissioning', 'hot_commissioning', 'performance_test',
      'training', 'as_built', 'handover',
    ],
    network: { protocol: 'DNP3', topology: 'Star', redundancy: 'Dual-path radio / fibre' },
    samples: {
      io: () => [
        io('LT-301', 'Reservoir level', 'AI', 0, 8, 'm', 'IW10'),
        io('FT-301', 'Outlet flow', 'AI', 0, 1200, 'm³/h', 'IW12'),
        io('AT-301', 'Free chlorine residual', 'AI', 0, 5, 'mg/L', 'IW14'),
        io('PT-301', 'Pump discharge pressure', 'AI', 0, 16, 'bar', 'IW16'),
        io('YS-301', 'Pump P-301 running', 'DI', 0, 1, '', 'I0.1'),
        io('HS-301', 'Pump P-301 start command', 'DO', 0, 1, '', 'Q0.1'),
      ],
      interlocks: () => [
        il('LT-301', '<', 1, 'TRIP', 'Low reservoir level - trip pump P-301 to prevent dry running'),
        il('AT-301', '<', 0.2, 'ALARM', 'Low chlorine residual - disinfection compliance risk'),
        il('PT-301', '>', 14, 'TRIP', 'High discharge pressure - trip pump P-301'),
      ],
    },
  },
  {
    id: 'food_beverage',
    name: 'Food & Beverage',
    icon: 'Utensils',
    summary: 'Batch processing, pasteurisation, CIP/SIP, packaging and hygienic design.',
    vendors: ['rockwell', 'siemens', 'schneider'],
    protocols: ['EtherNet/IP', 'Profinet', 'OPC UA'],
    standards: ['ISA-88', 'IEC 61131-3', 'ISA-18.2', 'IEC 62443'],
    steps: [
      'feed_review', 'urs', 'p_id_review', 'tag_naming', 'io_list', 'cause_effect', 'network_arch', 'panel_design', 'cybersecurity',
      'plc_programming', 'interlock_logic', 'batch_isa88', 'scada_development', 'alarm_rationalization',
      'fat_prep', 'fat',
      'installation', 'cable_megger', 'instrument_calibration', 'loop_check', 'cip_validation',
      'sat', 'cold_commissioning', 'hot_commissioning', 'performance_test',
      'training', 'as_built', 'handover',
    ],
    network: { protocol: 'EtherNet/IP', topology: 'Redundant ring', redundancy: 'DLR (Device Level Ring)' },
    samples: {
      io: () => [
        io('TT-401', 'Pasteuriser holding tube temperature', 'AI', 0, 100, '°C', 'IW20'),
        io('FT-401', 'Product flow', 'AI', 0, 20, 'm³/h', 'IW22'),
        io('LT-401', 'Balance tank level', 'AI', 0, 100, '%', 'IW24'),
        io('AT-401', 'CIP return conductivity', 'AI', 0, 200, 'mS/cm', 'IW26'),
        io('YS-401', 'Flow diversion valve in forward position', 'DI', 0, 1, '', 'I2.0'),
        io('XV-401', 'Flow diversion valve command', 'DO', 0, 1, '', 'Q2.0'),
      ],
      interlocks: () => [
        il('TT-401', '<', 72, 'TRIP', 'Low pasteurisation temperature - divert product to balance tank'),
        il('LT-401', '<', 15, 'TRIP', 'Low balance tank level - stop feed pump'),
      ],
    },
  },
  {
    id: 'power_grid',
    name: 'Power Grid / Substations',
    icon: 'Zap',
    summary: 'HV/MV substations, protection relays, IEC 61850 automation and RTU gateways.',
    vendors: ['siemens', 'abb', 'ge', 'schneider'],
    protocols: ['IEC 61850 (MMS / GOOSE)', 'IEC 60870-5-104', 'DNP3', 'Modbus TCP'],
    standards: ['IEC 61850', 'IEC 62443', 'IEC 61439', 'ISA-18.2'],
    steps: [
      'feed_review', 'urs', 'p_id_review', 'tag_naming', 'io_list', 'cause_effect', 'network_arch', 'panel_design', 'cybersecurity',
      'plc_programming', 'interlock_logic', 'scada_development', 'alarm_rationalization',
      'fat_prep', 'fat',
      'installation', 'cable_megger', 'instrument_calibration', 'protection_relay_test', 'loop_check', 'iec61850_comm_test',
      'sat', 'cold_commissioning', 'hot_commissioning', 'performance_test',
      'training', 'as_built', 'handover',
    ],
    network: { protocol: 'IEC 61850 (MMS / GOOSE)', topology: 'PRP / HSR', redundancy: 'PRP / HSR (zero recovery time)' },
    samples: {
      io: () => [
        io('TT-501', 'Transformer T1 winding temperature', 'AI', 0, 150, '°C', 'IED1.MMXU1.Temp'),
        io('ET-501', 'Busbar voltage 33kV', 'AI', 0, 40, 'kV', 'IED1.MMXU1.PPV'),
        io('IT-501', 'Feeder F1 current', 'AI', 0, 800, 'A', 'IED2.MMXU1.A'),
        io('ZS-501', 'Circuit breaker CB-01 closed', 'DI', 0, 1, '', 'IED2.XCBR1.Pos'),
        io('HS-501', 'CB-01 trip command', 'DO', 0, 1, '', 'IED2.XCBR1.Trip'),
      ],
      interlocks: () => [
        il('TT-501', '>', 105, 'ALARM', 'Transformer winding temperature high - alarm'),
        il('TT-501', '>', 120, 'TRIP', 'Transformer winding temperature high-high - trip CB-01'),
        il('IT-501', '>', 720, 'TRIP', 'Feeder overcurrent (50/51) - trip CB-01'),
      ],
    },
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure (Tunnels, Buildings, Utilities)',
    icon: 'Building2',
    summary: 'Tunnel ventilation, BMS integration, fire & life safety interfaces and utility networks.',
    vendors: ['siemens', 'schneider', 'abb'],
    protocols: ['BACnet/IP', 'Modbus TCP', 'OPC UA', 'Profinet'],
    standards: ['IEC 62443', 'ISA-101', 'IEC 61131-3', 'ISA-18.2'],
    steps: [
      'feed_review', 'urs', 'p_id_review', 'tag_naming', 'io_list', 'cause_effect', 'network_arch', 'panel_design', 'cybersecurity',
      'plc_programming', 'interlock_logic', 'scada_development', 'alarm_rationalization',
      'fat_prep', 'fat',
      'installation', 'cable_megger', 'instrument_calibration', 'loop_check',
      'sat', 'cold_commissioning', 'hot_commissioning',
      'training', 'as_built', 'handover',
    ],
    network: { protocol: 'BACnet/IP', topology: 'Redundant ring', redundancy: 'RSTP' },
    samples: {
      io: () => [
        io('AT-601', 'Tunnel CO concentration', 'AI', 0, 300, 'ppm', 'IW30'),
        io('PT-601', 'Tunnel differential pressure', 'AI', -100, 100, 'Pa', 'IW32'),
        io('YS-601', 'Jet fan JF-01 running', 'DI', 0, 1, '', 'I3.0'),
        io('HS-601', 'Jet fan JF-01 start command', 'DO', 0, 1, '', 'Q3.0'),
      ],
      interlocks: () => [
        il('AT-601', '>', 100, 'ALARM', 'High CO concentration - start jet fans in high speed'),
        il('AT-601', '>', 200, 'ESD', 'CO critical - initiate emergency ventilation mode'),
      ],
    },
  },
  {
    id: 'metals_minerals',
    name: 'Metals & Minerals',
    icon: 'Mountain',
    summary: 'Crushing, conveying, furnaces and mill automation with heavy-duty drives.',
    vendors: ['abb', 'siemens', 'rockwell', 'ge'],
    protocols: ['Profibus DP', 'Profinet', 'EtherNet/IP', 'Modbus TCP'],
    standards: ['IEC 61511', 'IEC 61131-3', 'ISA-18.2', 'IEC 62443'],
    steps: [
      'feed_review', 'urs', 'hazop_sil', 'p_id_review', 'tag_naming', 'io_list', 'cause_effect', 'network_arch', 'panel_design', 'cybersecurity',
      'plc_programming', 'interlock_logic', 'scada_development', 'alarm_rationalization',
      'fat_prep', 'fat',
      'installation', 'cable_megger', 'instrument_calibration', 'loop_check', 'esd_verification',
      'sat', 'cold_commissioning', 'hot_commissioning', 'performance_test',
      'training', 'as_built', 'handover',
    ],
    network: { protocol: 'Profibus DP', topology: 'Line', redundancy: 'Redundant PROFIBUS master' },
    samples: {
      io: () => [
        io('ST-701', 'Conveyor C-701 belt speed', 'AI', 0, 5, 'm/s', 'IW40'),
        io('TT-701', 'Mill gearbox bearing temperature', 'AI', 0, 150, '°C', 'IW42'),
        io('ZS-701', 'Belt misalignment switch', 'DI', 0, 1, '', 'I4.0'),
        io('HS-701', 'Conveyor C-701 start command', 'DO', 0, 1, '', 'Q4.0'),
      ],
      interlocks: () => [
        il('TT-701', '>', 95, 'TRIP', 'High bearing temperature - trip mill drive'),
        il('ZS-701', '==', 1, 'TRIP', 'Belt misalignment - stop conveyor C-701'),
      ],
    },
  },
];

export const sectorById = (id) => SECTORS.find((s) => s.id === id);

/* ------------------------------------------------------------------ *
 *  Step / workflow factories                                          *
 * ------------------------------------------------------------------ */

export const emptyConfig = () => ({
  ioPoints: [],
  tagConvention: '',
  interlocks: [],
  loopCheck: { tolerance: '0.5', testPoints: '0,25,50,75,100' },
  calibration: [],
  network: { protocol: '', topology: '', redundancy: '', ipRange: '', notes: '' },
  checklist: [],
  signoff: { engineer: '', client: '', date: '', status: 'pending' },
  notes: '',
});

export function createStep(key, overrides = {}) {
  const def = stepDef(key);
  if (!def) throw new Error(`Unknown step key: ${key}`);
  const config = emptyConfig();
  config.checklist = (def.checklist || []).map((text) => ({ id: uuidv4(), text, done: false }));
  return {
    id: uuidv4(),
    key,
    name: def.name,
    phase: def.phase,
    description: def.description,
    standards: [...(def.standards || [])],
    parallel: false,
    config,
    ...overrides,
  };
}

export function createCustomStep(phase = 'design') {
  return {
    id: uuidv4(),
    key: 'custom',
    name: 'Custom Step',
    phase,
    description: '',
    standards: [],
    parallel: false,
    config: emptyConfig(),
  };
}

export const DEFAULT_TAG_CONVENTION = '<ISA function letters>-<loop number> e.g. TT-101, FT-101, PT-201 (ISA-5.1)';

export function createWorkflowFromSector(sectorId) {
  const sector = sectorById(sectorId);
  if (!sector) return [];
  const steps = sector.steps.map((k) => createStep(k));
  const ioStep = steps.find((s) => s.key === 'io_list');
  if (ioStep && sector.samples) ioStep.config.ioPoints = sector.samples.io();
  const tagStep = steps.find((s) => s.key === 'tag_naming');
  if (tagStep) tagStep.config.tagConvention = DEFAULT_TAG_CONVENTION;
  const ilStep = steps.find((s) => s.key === 'interlock_logic');
  if (ilStep && sector.samples) ilStep.config.interlocks = sector.samples.interlocks();
  const netStep = steps.find((s) => s.key === 'network_arch');
  if (netStep && sector.network) netStep.config.network = { ...netStep.config.network, ...sector.network };
  // Instrument calibration prefilled from AI points
  const calStep = steps.find((s) => s.key === 'instrument_calibration');
  if (calStep && ioStep) {
    calStep.config.calibration = ioStep.config.ioPoints
      .filter((p) => p.type === 'AI')
      .map((p) => ({ id: uuidv4(), tag: p.tag, range: `${p.min} - ${p.max} ${p.units}`.trim(), asFound: '', asLeft: '', pass: false }));
  }
  return steps;
}

/* ------------------------------------------------------------------ *
 *  Audit rules                                                        *
 * ------------------------------------------------------------------ */

// Sequence rules: `before` must appear ahead of `after` when both exist.
export const ORDER_RULES = [
  { before: 'urs', after: 'io_list', standard: 'IEC 62381', msg: 'The I/O list must be derived from the approved URS / FDS.' },
  { before: 'tag_naming', after: 'io_list', standard: 'ISA-5.1', msg: 'Define the tag naming convention before building the I/O list.' },
  { before: 'p_id_review', after: 'io_list', standard: 'ISA-5.1', msg: 'Review P&IDs before building the I/O list.' },
  { before: 'hazop_sil', after: 'cause_effect', standard: 'IEC 61511', msg: 'HAZOP / SIL outcomes must feed the cause & effect matrix.' },
  { before: 'cause_effect', after: 'interlock_logic', standard: 'IEC 61511', msg: 'Interlocks must be implemented from the approved cause & effect matrix.' },
  { before: 'io_list', after: 'plc_programming', standard: 'IEC 61131-3', msg: 'Do not start PLC programming before the I/O list is issued.' },
  { before: 'io_list', after: 'scada_development', standard: 'ISA-101', msg: 'SCADA tag database depends on the I/O list.' },
  { before: 'network_arch', after: 'plc_programming', standard: 'IEC 62443', msg: 'Network architecture should be settled before controller configuration.' },
  { before: 'plc_programming', after: 'fat', standard: 'IEC 62381', msg: 'Programming must be complete before FAT.' },
  { before: 'interlock_logic', after: 'fat', standard: 'IEC 62381', msg: 'Interlock logic must be implemented before it can be proven at FAT.' },
  { before: 'scada_development', after: 'fat', standard: 'IEC 62381', msg: 'SCADA / HMI must be developed before FAT.' },
  { before: 'fat_prep', after: 'fat', standard: 'IEC 62381', msg: 'Prepare the FAT procedure before running FAT.' },
  { before: 'alarm_rationalization', after: 'fat', standard: 'ISA-18.2', msg: 'Rationalise alarms before FAT so the alarm database is tested once.' },
  { before: 'fat', after: 'installation', standard: 'IEC 62381', msg: 'FAT should be passed before shipping and installing on site.' },
  { before: 'installation', after: 'cable_megger', standard: 'IEC 61439', msg: 'Cables must be installed before continuity / insulation tests.' },
  { before: 'cable_megger', after: 'loop_check', standard: 'IEC 61439', msg: 'Insulation and continuity tests must pass before energising for loop checks.' },
  { before: 'instrument_calibration', after: 'loop_check', standard: 'ISA-5.1', msg: 'Calibrate instruments before loop checks so ranges are trustworthy.' },
  { before: 'loop_check', after: 'cold_commissioning', standard: 'IEC 62381', msg: 'Loop checks must be complete before cold commissioning.' },
  { before: 'loop_check', after: 'sat', standard: 'IEC 62381', msg: 'Loop checks should precede SAT.' },
  { before: 'esd_verification', after: 'hot_commissioning', standard: 'IEC 61511', msg: 'ESD / SIS functions must be verified before introducing process (hot commissioning).' },
  { before: 'protection_relay_test', after: 'hot_commissioning', standard: 'IEC 61850', msg: 'Protection relay tests must be complete before energisation.' },
  { before: 'iec61850_comm_test', after: 'sat', standard: 'IEC 61850', msg: 'IEC 61850 communication tests should be complete before SAT.' },
  { before: 'cip_validation', after: 'hot_commissioning', standard: 'ISA-88', msg: 'CIP / SIP must be validated before introducing product.' },
  { before: 'sat', after: 'cold_commissioning', standard: 'IEC 62381', msg: 'SAT should be completed before commissioning begins.' },
  { before: 'cold_commissioning', after: 'hot_commissioning', standard: 'ASHRAE Guideline 1.1', msg: 'Cold commissioning must precede hot commissioning.' },
  { before: 'hot_commissioning', after: 'performance_test', standard: 'ASHRAE Guideline 1.1', msg: 'Performance tests run after stable hot commissioning.' },
  { before: 'training', after: 'handover', standard: 'IEC 62381', msg: 'Operator training should be delivered before formal handover.' },
  { before: 'as_built', after: 'handover', standard: 'IEC 62381', msg: 'As-built documentation must be issued before handover.' },
];

const ALL = ['*'];

// Presence rules: every sector (or the listed ones) must include the step.
export const GAP_RULES = [
  { key: 'urs', sectors: ALL, severity: 'critical', title: 'No URS / Functional Design Specification', detail: 'Without an approved URS/FDS there is no baseline to test against at FAT/SAT.', standard: 'IEC 62381' },
  { key: 'tag_naming', sectors: ALL, severity: 'warning', title: 'No tag naming convention step', detail: 'Inconsistent tags between P&ID, PLC and SCADA are a leading cause of loop check rework.', standard: 'ISA-5.1' },
  { key: 'io_list', sectors: ALL, severity: 'critical', title: 'No I/O list / signal mapping', detail: 'The I/O list is the foundation for programming, FAT, loop checks and SCADA tags.', standard: 'ISA-5.1' },
  { key: 'cause_effect', sectors: ALL, severity: 'warning', title: 'No cause & effect matrix', detail: 'Interlocks and trips need a reviewed C&E document to be implemented and tested consistently.', standard: 'IEC 61511' },
  { key: 'network_arch', sectors: ALL, severity: 'warning', title: 'No network architecture design', detail: 'Communication topology, redundancy and addressing must be agreed before configuration.', standard: 'IEC 62443' },
  { key: 'cybersecurity', sectors: ALL, severity: 'warning', title: 'No cybersecurity design / zoning', detail: 'Modern clients require IEC 62443 aligned zones, conduits and access control.', standard: 'IEC 62443' },
  { key: 'interlock_logic', sectors: ALL, severity: 'critical', title: 'No interlock & permissive implementation', detail: 'Plant protection logic is not covered by the workflow.', standard: 'IEC 61511' },
  { key: 'alarm_rationalization', sectors: ALL, severity: 'info', title: 'No alarm rationalisation', detail: 'Unrationalised alarms lead to operator alarm floods.', standard: 'ISA-18.2' },
  { key: 'fat', sectors: ALL, severity: 'critical', title: 'No Factory Acceptance Test', detail: 'Systems should be proven in the factory before shipping to site.', standard: 'IEC 62381' },
  { key: 'instrument_calibration', sectors: ALL, severity: 'warning', title: 'No instrument calibration', detail: 'Uncalibrated instruments invalidate loop check results.', standard: 'ISA-5.1' },
  { key: 'loop_check', sectors: ALL, severity: 'critical', title: 'No loop checks', detail: 'Every instrument loop must be verified from field to HMI before commissioning.', standard: 'IEC 62381' },
  { key: 'sat', sectors: ALL, severity: 'critical', title: 'No Site Acceptance Test', detail: 'SAT demonstrates the installed system meets the contract requirements.', standard: 'IEC 62381' },
  { key: 'cold_commissioning', sectors: ALL, severity: 'warning', title: 'No cold commissioning', detail: 'Dry-run checks reduce risk before process fluid or energy is introduced.', standard: 'ASHRAE Guideline 1.1' },
  { key: 'hot_commissioning', sectors: ALL, severity: 'warning', title: 'No hot commissioning', detail: 'Loop tuning and behaviour under load are not covered.', standard: 'ASHRAE Guideline 1.1' },
  { key: 'training', sectors: ALL, severity: 'info', title: 'No operator training', detail: 'Handover without training is a common cause of early operational incidents.', standard: 'ISA-101' },
  { key: 'as_built', sectors: ALL, severity: 'warning', title: 'No as-built documentation / software backup', detail: 'Final code, configuration and drawings must be archived at handover.', standard: 'IEC 62381' },
  { key: 'handover', sectors: ALL, severity: 'warning', title: 'No formal handover', detail: 'The project needs a formal closeout with a completion certificate.', standard: 'IEC 62381' },

  // Sector specific
  { key: 'hazop_sil', sectors: ['oil_gas', 'metals_minerals'], severity: 'critical', title: 'HAZOP / SIL review missing', detail: 'Safety functions cannot be designed without HAZOP and SIL determination outcomes.', standard: 'IEC 61511' },
  { key: 'esd_verification', sectors: ['oil_gas', 'metals_minerals'], severity: 'critical', title: 'ESD / SIS interlock verification missing', detail: 'Emergency shutdown functions must be tested end-to-end (sensor to final element) before start-up.', standard: 'IEC 61511' },
  { key: 'energy_metering', sectors: ['district_cooling'], severity: 'warning', title: 'BTU / energy metering integration missing', detail: 'District cooling billing and kW/TR efficiency depend on validated meter data.', standard: 'ASHRAE Guideline 1.1' },
  { key: 'batch_isa88', sectors: ['food_beverage'], severity: 'warning', title: 'Batch / recipe management missing', detail: 'Recipe handling and batch records are required for traceability.', standard: 'ISA-88' },
  { key: 'cip_validation', sectors: ['food_beverage'], severity: 'critical', title: 'CIP / SIP validation missing', detail: 'Hygienic process cleaning sequences must be validated before production.', standard: 'ISA-88' },
  { key: 'protection_relay_test', sectors: ['power_grid'], severity: 'critical', title: 'Protection relay tests missing', detail: 'Secondary injection testing proves protection functions before energisation.', standard: 'IEC 61850' },
  { key: 'iec61850_comm_test', sectors: ['power_grid'], severity: 'warning', title: 'IEC 61850 communication test missing', detail: 'GOOSE and MMS behaviour must be verified between IEDs and SCADA.', standard: 'IEC 61850' },
];
