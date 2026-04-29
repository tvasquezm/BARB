export const MACHINES: Record<string, { name: string; model: string; status: string; cat: string; icon: string }> = {
  'comp-a1':  { name:'Compressor Unit A1', model:'Atlas Copco GA75', status:'operational', cat:'Pneumatic', icon:'💨' },
  'press-b3': { name:'Hydraulic Press B3', model:'Schuler P4000',    status:'warning',     cat:'Hydraulic', icon:'💧' },
  'cnc-c2':   { name:'CNC Mill C2',        model:'Haas VF-4',        status:'operational', cat:'Mechanical',icon:'⚙️' },
  'motor-d1': { name:'Motor Drive D1',     model:'ABB ACS880',       status:'maintenance', cat:'Electrical',icon:'⚡' },
  'plc':      { name:'PLC Controller',     model:'Siemens S7',       status:'operational', cat:'Automation',icon:'🤖' },
}

export default MACHINES
