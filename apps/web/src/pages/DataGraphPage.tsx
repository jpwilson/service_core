import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

// ─── DATA ──────────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  category: string;
  color: string;
  size: number;
  detail?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Driver': '#f89020',
  'Service Crew': '#f97316',
  'Office': '#fb923c',
  'Project': '#0a1f44',
  'Customer': '#3b82f6',
  'Equipment': '#22c55e',
  'Location': '#8b5cf6',
  'Department': '#14b8a6',
  'Time Category': '#ef4444',
};

const CATEGORY_SIZES: Record<string, number> = {
  'Driver': 0.5,
  'Service Crew': 0.5,
  'Office': 0.5,
  'Project': 0.7,
  'Customer': 0.65,
  'Equipment': 0.4,
  'Location': 0.55,
  'Department': 0.9,
  'Time Category': 0.45,
};

// Employees (18 total)
const employees: GraphNode[] = [
  // Drivers (8)
  { id: 'emp-1', label: 'Marcus Trujillo', category: 'Driver', color: CATEGORY_COLORS['Driver'], size: CATEGORY_SIZES['Driver'], detail: 'CDL-A · 5 years' },
  { id: 'emp-2', label: 'Jake Sandoval', category: 'Driver', color: CATEGORY_COLORS['Driver'], size: CATEGORY_SIZES['Driver'], detail: 'CDL-B · 3 years' },
  { id: 'emp-3', label: 'Luis Ramirez', category: 'Driver', color: CATEGORY_COLORS['Driver'], size: CATEGORY_SIZES['Driver'], detail: 'CDL-A · 7 years' },
  { id: 'emp-4', label: 'Derek Fulton', category: 'Driver', color: CATEGORY_COLORS['Driver'], size: CATEGORY_SIZES['Driver'], detail: 'CDL-B · 2 years' },
  { id: 'emp-5', label: 'Chris Nguyen', category: 'Driver', color: CATEGORY_COLORS['Driver'], size: CATEGORY_SIZES['Driver'], detail: 'CDL-A · 4 years' },
  { id: 'emp-6', label: 'Tyler Brooks', category: 'Driver', color: CATEGORY_COLORS['Driver'], size: CATEGORY_SIZES['Driver'], detail: 'CDL-B · 1 year' },
  { id: 'emp-7', label: 'Jordan Wells', category: 'Driver', color: CATEGORY_COLORS['Driver'], size: CATEGORY_SIZES['Driver'], detail: 'CDL-A · 6 years' },
  { id: 'emp-8', label: 'Kevin Marsh', category: 'Driver', color: CATEGORY_COLORS['Driver'], size: CATEGORY_SIZES['Driver'], detail: 'CDL-B · 3 years' },
  // Service Crew (6)
  { id: 'emp-9', label: 'Tony Espinoza', category: 'Service Crew', color: CATEGORY_COLORS['Service Crew'], size: CATEGORY_SIZES['Service Crew'], detail: 'Lead Crew · 4 years' },
  { id: 'emp-10', label: 'Daniel Rojas', category: 'Service Crew', color: CATEGORY_COLORS['Service Crew'], size: CATEGORY_SIZES['Service Crew'], detail: 'Crew · 2 years' },
  { id: 'emp-11', label: 'Alex Moreno', category: 'Service Crew', color: CATEGORY_COLORS['Service Crew'], size: CATEGORY_SIZES['Service Crew'], detail: 'Crew · 1 year' },
  { id: 'emp-12', label: 'Brandon Hicks', category: 'Service Crew', color: CATEGORY_COLORS['Service Crew'], size: CATEGORY_SIZES['Service Crew'], detail: 'Crew · 3 years' },
  { id: 'emp-13', label: 'Sam Whitfield', category: 'Service Crew', color: CATEGORY_COLORS['Service Crew'], size: CATEGORY_SIZES['Service Crew'], detail: 'Crew · 2 years' },
  { id: 'emp-14', label: 'Ryan Chavez', category: 'Service Crew', color: CATEGORY_COLORS['Service Crew'], size: CATEGORY_SIZES['Service Crew'], detail: 'Lead Crew · 5 years' },
  // Office (4)
  { id: 'emp-15', label: 'Sarah Mitchell', category: 'Office', color: CATEGORY_COLORS['Office'], size: CATEGORY_SIZES['Office'], detail: 'Payroll Admin · 6 years' },
  { id: 'emp-16', label: 'Karen Lowe', category: 'Office', color: CATEGORY_COLORS['Office'], size: CATEGORY_SIZES['Office'], detail: 'Dispatcher · 4 years' },
  { id: 'emp-17', label: 'Emily Chen', category: 'Office', color: CATEGORY_COLORS['Office'], size: CATEGORY_SIZES['Office'], detail: 'Office Manager · 8 years' },
  { id: 'emp-18', label: 'Megan Torres', category: 'Office', color: CATEGORY_COLORS['Office'], size: CATEGORY_SIZES['Office'], detail: 'Billing Clerk · 2 years' },
];

// Departments (3)
const departments: GraphNode[] = [
  { id: 'dept-1', label: 'Drivers', category: 'Department', color: CATEGORY_COLORS['Department'], size: CATEGORY_SIZES['Department'] },
  { id: 'dept-2', label: 'Service Crew', category: 'Department', color: CATEGORY_COLORS['Department'], size: CATEGORY_SIZES['Department'] },
  { id: 'dept-3', label: 'Office', category: 'Department', color: CATEGORY_COLORS['Department'], size: CATEGORY_SIZES['Department'] },
];

// Customers (8)
const customers: GraphNode[] = [
  { id: 'cust-1', label: 'Rocky Mountain Builders', category: 'Customer', color: CATEGORY_COLORS['Customer'], size: CATEGORY_SIZES['Customer'] },
  { id: 'cust-2', label: 'Front Range Events LLC', category: 'Customer', color: CATEGORY_COLORS['Customer'], size: CATEGORY_SIZES['Customer'] },
  { id: 'cust-3', label: 'Pikes Peak Construction', category: 'Customer', color: CATEGORY_COLORS['Customer'], size: CATEGORY_SIZES['Customer'] },
  { id: 'cust-4', label: 'Colorado Springs Venues', category: 'Customer', color: CATEGORY_COLORS['Customer'], size: CATEGORY_SIZES['Customer'] },
  { id: 'cust-5', label: 'Summit County Parks', category: 'Customer', color: CATEGORY_COLORS['Customer'], size: CATEGORY_SIZES['Customer'] },
  { id: 'cust-6', label: 'Mile High Stadium Grp', category: 'Customer', color: CATEGORY_COLORS['Customer'], size: CATEGORY_SIZES['Customer'] },
  { id: 'cust-7', label: 'Vail Resorts Services', category: 'Customer', color: CATEGORY_COLORS['Customer'], size: CATEGORY_SIZES['Customer'] },
  { id: 'cust-8', label: 'Denver Public Works', category: 'Customer', color: CATEGORY_COLORS['Customer'], size: CATEGORY_SIZES['Customer'] },
];

// Projects (15)
const projects: GraphNode[] = [
  { id: 'proj-1', label: 'Denver Metro Construction Site', category: 'Project', color: CATEGORY_COLORS['Project'], size: CATEGORY_SIZES['Project'] },
  { id: 'proj-2', label: 'Boulder Event Rental', category: 'Project', color: CATEGORY_COLORS['Project'], size: CATEGORY_SIZES['Project'] },
  { id: 'proj-3', label: 'Fort Collins Highway Expansion', category: 'Project', color: CATEGORY_COLORS['Project'], size: CATEGORY_SIZES['Project'] },
  { id: 'proj-4', label: 'Colorado Springs Festival', category: 'Project', color: CATEGORY_COLORS['Project'], size: CATEGORY_SIZES['Project'] },
  { id: 'proj-5', label: 'Pueblo Warehouse Build', category: 'Project', color: CATEGORY_COLORS['Project'], size: CATEGORY_SIZES['Project'] },
  { id: 'proj-6', label: 'Breckenridge Ski Season', category: 'Project', color: CATEGORY_COLORS['Project'], size: CATEGORY_SIZES['Project'] },
  { id: 'proj-7', label: 'Lakewood Park Renovation', category: 'Project', color: CATEGORY_COLORS['Project'], size: CATEGORY_SIZES['Project'] },
  { id: 'proj-8', label: 'Aurora Commercial Complex', category: 'Project', color: CATEGORY_COLORS['Project'], size: CATEGORY_SIZES['Project'] },
  { id: 'proj-9', label: 'Longmont Music Festival', category: 'Project', color: CATEGORY_COLORS['Project'], size: CATEGORY_SIZES['Project'] },
  { id: 'proj-10', label: 'Thornton Residential Dev', category: 'Project', color: CATEGORY_COLORS['Project'], size: CATEGORY_SIZES['Project'] },
  { id: 'proj-11', label: 'Vail Mountain Lodge', category: 'Project', color: CATEGORY_COLORS['Project'], size: CATEGORY_SIZES['Project'] },
  { id: 'proj-12', label: 'Greeley Feedlot Expansion', category: 'Project', color: CATEGORY_COLORS['Project'], size: CATEGORY_SIZES['Project'] },
  { id: 'proj-13', label: 'Arvada School District', category: 'Project', color: CATEGORY_COLORS['Project'], size: CATEGORY_SIZES['Project'] },
  { id: 'proj-14', label: 'Westminster City Hall', category: 'Project', color: CATEGORY_COLORS['Project'], size: CATEGORY_SIZES['Project'] },
  { id: 'proj-15', label: 'Centennial Office Park', category: 'Project', color: CATEGORY_COLORS['Project'], size: CATEGORY_SIZES['Project'] },
];

// Equipment
const equipment: GraphNode[] = [
  { id: 'equip-1', label: 'Standard Porta-John #1-10', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: '10 units' },
  { id: 'equip-2', label: 'Deluxe Porta-John #1-5', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: '5 units' },
  { id: 'equip-3', label: 'ADA Porta-John #1-3', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: '3 units' },
  { id: 'equip-4', label: 'Hand Wash Station A', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: 'Hand Wash Station' },
  { id: 'equip-5', label: 'Hand Wash Station B', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: 'Hand Wash Station' },
  { id: 'equip-6', label: 'Flatbed Trailer T-01', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: 'Transport Trailer' },
  { id: 'equip-7', label: 'Flatbed Trailer T-02', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: 'Transport Trailer' },
  { id: 'equip-8', label: 'Pump Truck P-01', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: 'Vacuum Pump Truck' },
];

// Locations (15)
const locations: GraphNode[] = [
  { id: 'loc-1', label: 'I-25 & Colfax Ave', category: 'Location', color: CATEGORY_COLORS['Location'], size: CATEGORY_SIZES['Location'] },
  { id: 'loc-2', label: 'Pearl St Mall, Boulder', category: 'Location', color: CATEGORY_COLORS['Location'], size: CATEGORY_SIZES['Location'] },
  { id: 'loc-3', label: 'US-287 Corridor', category: 'Location', color: CATEGORY_COLORS['Location'], size: CATEGORY_SIZES['Location'] },
  { id: 'loc-4', label: 'Memorial Park, CO Springs', category: 'Location', color: CATEGORY_COLORS['Location'], size: CATEGORY_SIZES['Location'] },
  { id: 'loc-5', label: 'Pueblo Industrial Zone', category: 'Location', color: CATEGORY_COLORS['Location'], size: CATEGORY_SIZES['Location'] },
  { id: 'loc-6', label: 'Breckenridge Resort Base', category: 'Location', color: CATEGORY_COLORS['Location'], size: CATEGORY_SIZES['Location'] },
  { id: 'loc-7', label: 'Bear Creek Park, Lakewood', category: 'Location', color: CATEGORY_COLORS['Location'], size: CATEGORY_SIZES['Location'] },
  { id: 'loc-8', label: 'Southlands Mall, Aurora', category: 'Location', color: CATEGORY_COLORS['Location'], size: CATEGORY_SIZES['Location'] },
  { id: 'loc-9', label: 'Roosevelt Park, Longmont', category: 'Location', color: CATEGORY_COLORS['Location'], size: CATEGORY_SIZES['Location'] },
  { id: 'loc-10', label: 'Thornton Civic Center', category: 'Location', color: CATEGORY_COLORS['Location'], size: CATEGORY_SIZES['Location'] },
  { id: 'loc-11', label: 'Vail Village', category: 'Location', color: CATEGORY_COLORS['Location'], size: CATEGORY_SIZES['Location'] },
  { id: 'loc-12', label: 'Greeley Ag District', category: 'Location', color: CATEGORY_COLORS['Location'], size: CATEGORY_SIZES['Location'] },
  { id: 'loc-13', label: 'Arvada Olde Town', category: 'Location', color: CATEGORY_COLORS['Location'], size: CATEGORY_SIZES['Location'] },
  { id: 'loc-14', label: 'Westminster Promenade', category: 'Location', color: CATEGORY_COLORS['Location'], size: CATEGORY_SIZES['Location'] },
  { id: 'loc-15', label: 'Centennial Business Park', category: 'Location', color: CATEGORY_COLORS['Location'], size: CATEGORY_SIZES['Location'] },
];

// Time Categories
const timeCategories: GraphNode[] = [
  { id: 'tc-1', label: 'Regular', category: 'Time Category', color: '#ef4444', size: CATEGORY_SIZES['Time Category'] },
  { id: 'tc-2', label: 'Overtime', category: 'Time Category', color: '#f59e0b', size: CATEGORY_SIZES['Time Category'] },
  { id: 'tc-3', label: 'Double Time', category: 'Time Category', color: '#eab308', size: CATEGORY_SIZES['Time Category'] },
];

const allNodes: GraphNode[] = [
  ...employees, ...departments, ...customers, ...projects,
  ...equipment, ...locations, ...timeCategories,
];

// ─── EDGES ─────────────────────────────────────────────────────────────────────

const edges: GraphEdge[] = [
  // Employee -> Department
  ...employees.filter(e => e.category === 'Driver').map(e => ({ source: e.id, target: 'dept-1', label: 'belongs to' })),
  ...employees.filter(e => e.category === 'Service Crew').map(e => ({ source: e.id, target: 'dept-2', label: 'belongs to' })),
  ...employees.filter(e => e.category === 'Office').map(e => ({ source: e.id, target: 'dept-3', label: 'belongs to' })),

  // Employee -> Project (2-3 projects per employee)
  { source: 'emp-1', target: 'proj-1', label: 'assigned to' }, { source: 'emp-1', target: 'proj-3', label: 'assigned to' }, { source: 'emp-1', target: 'proj-8', label: 'assigned to' },
  { source: 'emp-2', target: 'proj-2', label: 'assigned to' }, { source: 'emp-2', target: 'proj-4', label: 'assigned to' },
  { source: 'emp-3', target: 'proj-5', label: 'assigned to' }, { source: 'emp-3', target: 'proj-6', label: 'assigned to' }, { source: 'emp-3', target: 'proj-12', label: 'assigned to' },
  { source: 'emp-4', target: 'proj-7', label: 'assigned to' }, { source: 'emp-4', target: 'proj-9', label: 'assigned to' },
  { source: 'emp-5', target: 'proj-10', label: 'assigned to' }, { source: 'emp-5', target: 'proj-11', label: 'assigned to' },
  { source: 'emp-6', target: 'proj-1', label: 'assigned to' }, { source: 'emp-6', target: 'proj-13', label: 'assigned to' },
  { source: 'emp-7', target: 'proj-14', label: 'assigned to' }, { source: 'emp-7', target: 'proj-15', label: 'assigned to' }, { source: 'emp-7', target: 'proj-2', label: 'assigned to' },
  { source: 'emp-8', target: 'proj-3', label: 'assigned to' }, { source: 'emp-8', target: 'proj-5', label: 'assigned to' },
  { source: 'emp-9', target: 'proj-1', label: 'assigned to' }, { source: 'emp-9', target: 'proj-4', label: 'assigned to' }, { source: 'emp-9', target: 'proj-7', label: 'assigned to' },
  { source: 'emp-10', target: 'proj-2', label: 'assigned to' }, { source: 'emp-10', target: 'proj-6', label: 'assigned to' },
  { source: 'emp-11', target: 'proj-8', label: 'assigned to' }, { source: 'emp-11', target: 'proj-9', label: 'assigned to' },
  { source: 'emp-12', target: 'proj-10', label: 'assigned to' }, { source: 'emp-12', target: 'proj-12', label: 'assigned to' }, { source: 'emp-12', target: 'proj-13', label: 'assigned to' },
  { source: 'emp-13', target: 'proj-11', label: 'assigned to' }, { source: 'emp-13', target: 'proj-14', label: 'assigned to' },
  { source: 'emp-14', target: 'proj-15', label: 'assigned to' }, { source: 'emp-14', target: 'proj-3', label: 'assigned to' }, { source: 'emp-14', target: 'proj-5', label: 'assigned to' },
  { source: 'emp-15', target: 'proj-1', label: 'supports' }, { source: 'emp-15', target: 'proj-8', label: 'supports' },
  { source: 'emp-16', target: 'proj-2', label: 'supports' }, { source: 'emp-16', target: 'proj-4', label: 'supports' }, { source: 'emp-16', target: 'proj-9', label: 'supports' },
  { source: 'emp-17', target: 'proj-6', label: 'supports' }, { source: 'emp-17', target: 'proj-11', label: 'supports' },
  { source: 'emp-18', target: 'proj-13', label: 'supports' }, { source: 'emp-18', target: 'proj-15', label: 'supports' },

  // Project -> Customer
  { source: 'proj-1', target: 'cust-1', label: 'billed to' },
  { source: 'proj-2', target: 'cust-2', label: 'billed to' },
  { source: 'proj-3', target: 'cust-1', label: 'billed to' },
  { source: 'proj-4', target: 'cust-4', label: 'billed to' },
  { source: 'proj-5', target: 'cust-3', label: 'billed to' },
  { source: 'proj-6', target: 'cust-7', label: 'billed to' },
  { source: 'proj-7', target: 'cust-5', label: 'billed to' },
  { source: 'proj-8', target: 'cust-1', label: 'billed to' },
  { source: 'proj-9', target: 'cust-2', label: 'billed to' },
  { source: 'proj-10', target: 'cust-8', label: 'billed to' },
  { source: 'proj-11', target: 'cust-7', label: 'billed to' },
  { source: 'proj-12', target: 'cust-3', label: 'billed to' },
  { source: 'proj-13', target: 'cust-8', label: 'billed to' },
  { source: 'proj-14', target: 'cust-8', label: 'billed to' },
  { source: 'proj-15', target: 'cust-6', label: 'billed to' },

  // Project -> Location
  { source: 'proj-1', target: 'loc-1', label: 'located at' },
  { source: 'proj-2', target: 'loc-2', label: 'located at' },
  { source: 'proj-3', target: 'loc-3', label: 'located at' },
  { source: 'proj-4', target: 'loc-4', label: 'located at' },
  { source: 'proj-5', target: 'loc-5', label: 'located at' },
  { source: 'proj-6', target: 'loc-6', label: 'located at' },
  { source: 'proj-7', target: 'loc-7', label: 'located at' },
  { source: 'proj-8', target: 'loc-8', label: 'located at' },
  { source: 'proj-9', target: 'loc-9', label: 'located at' },
  { source: 'proj-10', target: 'loc-10', label: 'located at' },
  { source: 'proj-11', target: 'loc-11', label: 'located at' },
  { source: 'proj-12', target: 'loc-12', label: 'located at' },
  { source: 'proj-13', target: 'loc-13', label: 'located at' },
  { source: 'proj-14', target: 'loc-14', label: 'located at' },
  { source: 'proj-15', target: 'loc-15', label: 'located at' },

  // Equipment -> Location
  { source: 'equip-1', target: 'loc-1', label: 'deployed at' },
  { source: 'equip-1', target: 'loc-5', label: 'deployed at' },
  { source: 'equip-2', target: 'loc-2', label: 'deployed at' },
  { source: 'equip-2', target: 'loc-4', label: 'deployed at' },
  { source: 'equip-3', target: 'loc-6', label: 'deployed at' },
  { source: 'equip-4', target: 'loc-1', label: 'deployed at' },
  { source: 'equip-4', target: 'loc-3', label: 'deployed at' },
  { source: 'equip-5', target: 'loc-9', label: 'deployed at' },
  { source: 'equip-6', target: 'loc-7', label: 'deployed at' },
  { source: 'equip-7', target: 'loc-12', label: 'deployed at' },
  { source: 'equip-8', target: 'loc-8', label: 'deployed at' },

  // Employee -> Time Category
  ...employees.map(e => ({ source: e.id, target: 'tc-1', label: 'regular hours' })),
  ...employees.filter((_, i) => i % 2 === 0).map(e => ({ source: e.id, target: 'tc-2', label: 'overtime hours' })),
  ...employees.filter((_, i) => i % 5 === 0).map(e => ({ source: e.id, target: 'tc-3', label: 'double time hours' })),
];

// ─── LEGEND DATA ───────────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { label: 'Drivers', color: '#f89020' },
  { label: 'Service Crew', color: '#f97316' },
  { label: 'Office', color: '#fb923c' },
  { label: 'Projects', color: '#0a1f44', border: true },
  { label: 'Customers', color: '#3b82f6' },
  { label: 'Equipment', color: '#22c55e' },
  { label: 'Locations', color: '#8b5cf6' },
  { label: 'Departments', color: '#14b8a6' },
  { label: 'Time Cat.', color: '#ef4444' },
];

const PULSE_YELLOW = '#FFD700';

// ─── LINK DISTANCE MAP ─────────────────────────────────────────────────────────

const LINK_DISTANCE_BY_LABEL: Record<string, number> = {
  'belongs to': 50,
  'assigned to': 80,
  'supports': 80,
  'billed to': 60,
  'located at': 70,
  'deployed at': 60,
  'regular hours': 40,
  'overtime hours': 40,
  'double time hours': 40,
};

// ─── LABEL SPRITE HELPER ───────────────────────────────────────────────────────

function makeLabelSprite(
  lines: string[],
  opts: { fontSize?: number; bg?: string; fg?: string; accent?: string; width?: number; scale?: number } = {}
) {
  const fontSize = opts.fontSize ?? 28;
  const bg = opts.bg ?? 'rgba(0,0,0,0.78)';
  const fg = opts.fg ?? '#fff';
  const accent = opts.accent ?? '#FFE082';
  const canvasW = opts.width ?? 512;
  const lineH = fontSize * 1.35;
  const canvasH = Math.max(64, lines.length * lineH + 24);
  const spriteScale = opts.scale ?? 40;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW * 2;
  canvas.height = canvasH * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  const r = 10, pad = 6;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(pad + r, pad);
  ctx.lineTo(canvasW - pad - r, pad);
  ctx.quadraticCurveTo(canvasW - pad, pad, canvasW - pad, pad + r);
  ctx.lineTo(canvasW - pad, canvasH - pad - r);
  ctx.quadraticCurveTo(canvasW - pad, canvasH - pad, canvasW - pad - r, canvasH - pad);
  ctx.lineTo(pad + r, canvasH - pad);
  ctx.quadraticCurveTo(pad, canvasH - pad, pad, canvasH - pad - r);
  ctx.lineTo(pad, pad + r);
  ctx.quadraticCurveTo(pad, pad, pad + r, pad);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((text, i) => {
    const isFirst = i === 0;
    ctx.fillStyle = isFirst ? fg : accent;
    ctx.font = `${isFirst ? 'bold ' : ''}${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillText(text, canvasW / 2, 12 + i * lineH, canvasW - 24);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, sizeAttenuation: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(spriteScale, spriteScale * (canvasH / canvasW), 1);
  return sprite;
}

// ─── INSIGHT GENERATOR ─────────────────────────────────────────────────────────

function generateInsight(node: GraphNode, connections: { label: string; node: GraphNode }[]): string {
  const cat = node.category;

  if (cat === 'Driver' || cat === 'Service Crew' || cat === 'Office') {
    const projectEdges = connections.filter(c => c.node.category === 'Project');
    const customerIds = new Set<string>();
    for (const pe of projectEdges) {
      const custEdge = edges.find(e => e.source === pe.node.id && e.label === 'billed to');
      if (custEdge) customerIds.add(custEdge.target);
    }
    const deptCount = connections.filter(c => c.node.category === 'Department').length;
    if (projectEdges.length >= 3) {
      return `High cross-project exposure: assigned to ${projectEdges.length} projects across ${customerIds.size} different customer${customerIds.size !== 1 ? 's' : ''}. ${deptCount > 0 ? 'Core team member.' : ''}`;
    }
    return `Assigned to ${projectEdges.length} project${projectEdges.length !== 1 ? 's' : ''} serving ${customerIds.size} customer${customerIds.size !== 1 ? 's' : ''}. Stable workload distribution.`;
  }

  if (cat === 'Project') {
    const empConns = connections.filter(c => ['Driver', 'Service Crew', 'Office'].includes(c.node.category));
    const custConn = connections.find(c => c.node.category === 'Customer');
    const locConn = connections.find(c => c.node.category === 'Location');
    return `${empConns.length} staff assigned${custConn ? ` for ${custConn.node.label}` : ''}${locConn ? ` at ${locConn.node.label}` : ''}. ${empConns.length >= 4 ? 'Large deployment requiring coordination.' : 'Standard team size.'}`;
  }

  if (cat === 'Customer') {
    const projConns = connections.filter(c => c.node.category === 'Project');
    let totalEmps = 0;
    for (const pc of projConns) {
      totalEmps += edges.filter(e => e.target === pc.node.id && (e.label === 'assigned to' || e.label === 'supports')).length;
    }
    return `${projConns.length} active project${projConns.length !== 1 ? 's' : ''} with ~${totalEmps} total staff assignments. ${projConns.length >= 3 ? 'Major account requiring dedicated management.' : 'Standard engagement level.'}`;
  }

  if (cat === 'Equipment') {
    const locConns = connections.filter(c => c.node.category === 'Location');
    return `Deployed across ${locConns.length} location${locConns.length !== 1 ? 's' : ''}. ${locConns.length >= 2 ? 'High utilization — serving multiple sites.' : 'Single-site deployment.'}`;
  }

  if (cat === 'Location') {
    const projConns = connections.filter(c => c.node.category === 'Project');
    const equipConns = connections.filter(c => c.node.category === 'Equipment');
    return `${projConns.length} project${projConns.length !== 1 ? 's' : ''} and ${equipConns.length} equipment item${equipConns.length !== 1 ? 's' : ''} at this site. ${projConns.length + equipConns.length >= 3 ? 'High-activity location.' : 'Standard site.'}`;
  }

  if (cat === 'Department') {
    const empConns = connections.filter(c => ['Driver', 'Service Crew', 'Office'].includes(c.node.category));
    return `${empConns.length} team member${empConns.length !== 1 ? 's' : ''} in this department. ${empConns.length >= 6 ? 'Largest operational group.' : 'Compact team.'}`;
  }

  if (cat === 'Time Category') {
    const empConns = connections.filter(c => ['Driver', 'Service Crew', 'Office'].includes(c.node.category));
    return `${empConns.length} employee${empConns.length !== 1 ? 's' : ''} logging ${node.label.toLowerCase()} hours. ${empConns.length >= 10 ? 'Universal category across workforce.' : 'Selective application.'}`;
  }

  return `${connections.length} connection${connections.length !== 1 ? 's' : ''} in the operational network.`;
}

// ─── NODE LOOKUP MAP ───────────────────────────────────────────────────────────

const nodeMap: Record<string, GraphNode> = {};
for (const n of allNodes) nodeMap[n.id] = n;

// ─── FORCE GRAPH DATA ──────────────────────────────────────────────────────────

interface FGNode {
  id: string;
  label: string;
  category: string;
  color: string;
  size: number;
  detail?: string;
  val: number;
  x?: number;
  y?: number;
  z?: number;
}

interface FGLink {
  source: string;
  target: string;
  label: string;
  linkId: string;
}

function buildGraphData(): { nodes: FGNode[]; links: FGLink[] } {
  const nodes: FGNode[] = allNodes.map(n => ({
    ...n,
    val: n.size * 20,
  }));
  const links: FGLink[] = edges.map((e, i) => ({
    source: e.source,
    target: e.target,
    label: e.label,
    linkId: `link-${i}`,
  }));
  return { nodes, links };
}

// ─── GEOMETRY SIZE MULTIPLIER ──────────────────────────────────────────────────

const SIZE_MULT: Record<string, number> = {
  'Driver': 5,
  'Service Crew': 5,
  'Office': 5,
  'Project': 6,
  'Customer': 6,
  'Equipment': 4.5,
  'Location': 5,
  'Department': 8,
  'Time Category': 4.5,
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export function DataGraphPage() {
  const navigate = useNavigate();
  const fgRef = useRef<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pulsingLinks, setPulsingLinks] = useState<Set<string>>(new Set());
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const containerRef = useRef<HTMLDivElement>(null);

  const graphData = useMemo(() => buildGraphData(), []);

  // Track container size
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Build adjacency for connected highlight
  const connectedIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const ids = new Set<string>([selectedNodeId]);
    edges.forEach(e => {
      if (e.source === selectedNodeId) ids.add(e.target);
      if (e.target === selectedNodeId) ids.add(e.source);
    });
    return ids;
  }, [selectedNodeId]);

  // Get connections for selected node (for insight panel)
  const selectedConnections = useMemo(() => {
    if (!selectedNodeId) return [];
    return edges
      .filter(e => e.source === selectedNodeId || e.target === selectedNodeId)
      .map(e => {
        const otherId = e.source === selectedNodeId ? e.target : e.source;
        const other = nodeMap[otherId];
        return other ? { label: e.label, node: other } : null;
      })
      .filter((c): c is { label: string; node: GraphNode } => c !== null);
  }, [selectedNodeId]);

  const selectedNode = selectedNodeId ? nodeMap[selectedNodeId] : null;

  // Group connections by label for the panel
  const groupedConnections = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    for (const c of selectedConnections) {
      if (!grouped[c.label]) grouped[c.label] = [];
      grouped[c.label].push(c.node.label);
    }
    return grouped;
  }, [selectedConnections]);

  // Configure forces
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength(-200);
      fgRef.current.d3Force('link')?.distance((link: any) => {
        return LINK_DISTANCE_BY_LABEL[link.label] || 80;
      });
    }
  }, [graphData]);

  // Fire pulse particles along connected links
  const firePulse = useCallback((nodeId: string) => {
    if (!fgRef.current) return;
    const fg = fgRef.current;

    const directLinks: any[] = [];
    graphData.links.forEach((l: any) => {
      const src = typeof l.source === 'object' ? l.source.id : l.source;
      const tgt = typeof l.target === 'object' ? l.target.id : l.target;
      if (src === nodeId || tgt === nodeId) {
        directLinks.push(l);
      }
    });

    const allPulseIds = new Set<string>();
    directLinks.forEach(l => allPulseIds.add(l.linkId));
    setPulsingLinks(allPulseIds);

    const emitWave = (links: any[], delay: number) => {
      setTimeout(() => {
        links.forEach(l => {
          try { fg.emitParticle(l); } catch (_) { /* not all versions support this */ }
        });
      }, delay);
    };

    emitWave(directLinks, 0);
    emitWave(directLinks, 150);
    emitWave(directLinks, 300);

    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => setPulsingLinks(new Set()), 2500);
  }, [graphData]);

  // Node click handler
  const handleNodeClick = useCallback(
    (node: any) => {
      if (!node) return;

      if (selectedNodeId === node.id) {
        setSelectedNodeId(null);
        setPulsingLinks(new Set());
        return;
      }

      setSelectedNodeId(node.id);
      firePulse(node.id);

      // Fly camera toward clicked node
      if (fgRef.current) {
        const dist = 120;
        const ratio = 1 + dist / Math.hypot(node.x || 1, node.y || 1, node.z || 1);
        fgRef.current.cameraPosition(
          { x: node.x * ratio, y: node.y * ratio, z: node.z * ratio },
          node,
          800
        );
      }
    },
    [selectedNodeId, firePulse]
  );

  const handleBackgroundClick = useCallback(() => {
    setSelectedNodeId(null);
    setPulsingLinks(new Set());
  }, []);

  const handleResetView = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.cameraPosition({ x: 0, y: 0, z: 400 }, { x: 0, y: 0, z: 0 }, 800);
    }
  }, []);

  // nodeThreeObject callback
  const nodeThreeObject = useCallback(
    (node: any) => {
      const hasSelection = !!selectedNodeId;
      const isConnected = connectedIds.has(node.id);
      const isSelected = selectedNodeId === node.id;
      const dimmed = hasSelection && !isConnected;
      const cat = node.category;
      const sz = (SIZE_MULT[cat] || 5) * node.size;

      // Choose geometry by category
      let geo: THREE.BufferGeometry;
      if (cat === 'Driver' || cat === 'Service Crew' || cat === 'Office') {
        geo = new THREE.DodecahedronGeometry(sz, 1);
      } else if (cat === 'Project') {
        geo = new THREE.OctahedronGeometry(sz, 0);
      } else if (cat === 'Customer') {
        geo = new THREE.IcosahedronGeometry(sz, 0);
      } else if (cat === 'Equipment') {
        geo = new THREE.BoxGeometry(sz * 1.4, sz * 1.4, sz * 1.4);
      } else if (cat === 'Location') {
        geo = new THREE.ConeGeometry(sz * 0.8, sz * 2, 6);
      } else if (cat === 'Department') {
        geo = new THREE.DodecahedronGeometry(sz, 1);
      } else {
        // Time Category
        geo = new THREE.SphereGeometry(sz, 24, 24);
      }

      const mat = new THREE.MeshPhongMaterial({
        color: node.color,
        transparent: true,
        opacity: dimmed ? 0.15 : 0.92,
        shininess: 80,
        flatShading: true,
        emissive: isSelected ? node.color : '#000000',
        emissiveIntensity: isSelected ? 0.3 : 0,
      });
      const mesh = new THREE.Mesh(geo, mat);

      // Wireframe overlay
      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: dimmed ? 0.05 : 0.25 })
      );
      mesh.add(wire);

      // Selection ring
      if (isSelected) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(sz + 2, 1.0, 8, 48),
          new THREE.MeshBasicMaterial({ color: PULSE_YELLOW, transparent: true, opacity: 0.5 })
        );
        mesh.add(ring);
      }

      // Label
      const labelLines: string[] = [node.label];
      if (node.detail) labelLines.push(node.detail);
      const isDept = cat === 'Department';

      const label = makeLabelSprite(labelLines, {
        fontSize: isDept ? 32 : 28,
        scale: isDept ? 48 : 36,
        width: 512,
        bg: dimmed ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.78)',
        fg: dimmed ? 'rgba(255,255,255,0.4)' : '#fff',
      });
      label.position.y = sz + (isDept ? 12 : 8);
      label.center.set(0.5, 0);

      const group = new THREE.Group();
      group.add(mesh);
      group.add(label);
      return group;
    },
    [selectedNodeId, connectedIds]
  );

  // Edge color based on category
  const getCategoryEdgeColor = (label: string): string => {
    switch (label) {
      case 'belongs to': return '#14b8a6';
      case 'assigned to': case 'supports': return '#f89020';
      case 'billed to': return '#3b82f6';
      case 'located at': return '#8b5cf6';
      case 'deployed at': return '#22c55e';
      case 'regular hours': return '#ef4444';
      case 'overtime hours': return '#f59e0b';
      case 'double time hours': return '#eab308';
      default: return '#6b7280';
    }
  };

  return (
    <div className="h-screen font-display flex flex-col overflow-hidden" style={{ background: '#0f172a' }}>
      {/* Header */}
      <header className="bg-secondary-500/90 backdrop-blur text-white px-6 py-3 flex items-center gap-4 relative z-30 flex-shrink-0">
        <button
          onClick={() => navigate('/project-details')}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">ServiceCore Data Graph</h1>
            <span className="bg-amber-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
              Experimental
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Interactive 3D force-directed graph of all operational data entities
          </p>
        </div>
        <button
          onClick={handleResetView}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
          title="Reset camera"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset View</span>
        </button>
      </header>

      {/* Canvas container */}
      <div className="flex-1 relative" ref={containerRef}>
        {/* Faint SERVICECORE watermark */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 5,
            userSelect: 'none',
            fontSize: '8vw',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            color: 'rgba(0, 255, 65, 0.04)',
            whiteSpace: 'nowrap',
          }}
        >
          SERVICECORE
        </div>

        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          nodeThreeObject={nodeThreeObject}
          nodeThreeObjectExtend={false}
          backgroundColor="#0f172a"
          width={dimensions.width}
          height={dimensions.height - 88}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          onNodeDrag={(node: any) => {
            node.fx = node.x;
            node.fy = node.y;
            node.fz = node.z;
          }}
          onNodeDragEnd={(node: any) => {
            node.fx = undefined;
            node.fy = undefined;
            node.fz = undefined;
          }}
          linkColor={(link: any) => {
            const linkLabel = link.label || '';
            const baseColor = getCategoryEdgeColor(linkLabel);
            if (!selectedNodeId) return baseColor + '40';
            const src = typeof link.source === 'object' ? link.source.id : link.source;
            const tgt = typeof link.target === 'object' ? link.target.id : link.target;
            const touches = src === selectedNodeId || tgt === selectedNodeId;
            if (touches) return baseColor + 'FF';
            if (pulsingLinks.has(link.linkId)) return baseColor + 'CC';
            return baseColor + '10';
          }}
          linkWidth={(link: any) => {
            if (selectedNodeId) {
              const src = typeof link.source === 'object' ? link.source.id : link.source;
              const tgt = typeof link.target === 'object' ? link.target.id : link.target;
              if (src === selectedNodeId || tgt === selectedNodeId) return 3.5;
              if (pulsingLinks.has(link.linkId)) return 2.5;
              return 0.3;
            }
            return 0.6;
          }}
          linkOpacity={0.6}
          linkDirectionalParticles={(link: any) => {
            if (pulsingLinks.has(link.linkId)) return 6;
            return 0;
          }}
          linkDirectionalParticleSpeed={0.02}
          linkDirectionalParticleWidth={(link: any) => {
            if (pulsingLinks.has(link.linkId)) return 4;
            return 0;
          }}
          linkDirectionalParticleColor={() => PULSE_YELLOW}
          enableNodeDrag={true}
          enableNavigationControls={true}
          showNavInfo={false}
          warmupTicks={80}
          cooldownTicks={200}
        />

        {/* Insight Panel — slides in from right */}
        {selectedNode && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 300,
              maxHeight: 'calc(100% - 32px)',
              overflowY: 'auto',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 0,
              zIndex: 20,
              color: '#fff',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              animation: 'slideInRight 0.25s ease-out',
            }}
          >
            {/* Node info header */}
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: selectedNode.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>{selectedNode.label}</span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginLeft: 18 }}>{selectedNode.category}</div>
              {selectedNode.detail && (
                <div style={{ fontSize: 12, color: '#cbd5e1', marginLeft: 18, marginTop: 2 }}>{selectedNode.detail}</div>
              )}
            </div>

            {/* Connections */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 600, marginBottom: 8 }}>
                Connections ({selectedConnections.length})
              </div>
              {Object.entries(groupedConnections).map(([rel, names]) => (
                <div key={rel} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginBottom: 2 }}>{rel}</div>
                  {names.slice(0, 8).map((name, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#e2e8f0', paddingLeft: 10, lineHeight: '1.6' }}>{name}</div>
                  ))}
                  {names.length > 8 && (
                    <div style={{ fontSize: 11, color: '#64748b', paddingLeft: 10 }}>+{names.length - 8} more</div>
                  )}
                </div>
              ))}
            </div>

            {/* Insight */}
            <div style={{ padding: '12px 16px 16px' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span role="img" aria-label="insight">&#x1F4A1;</span> Insight
              </div>
              <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: '1.6' }}>
                {generateInsight(selectedNode, selectedConnections)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend — compact footer */}
      <div className="bg-gray-900/90 backdrop-blur border-t border-gray-800 px-6 py-2 flex items-center justify-between relative z-30 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          {LEGEND_ITEMS.map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: item.color,
                  border: item.border ? '1px solid rgba(255,255,255,0.3)' : undefined,
                }}
              />
              <span className="text-gray-400 text-[11px]">{item.label}</span>
            </div>
          ))}
        </div>
        <span className="text-gray-600 text-[11px] hidden md:block">
          Drag: rotate &middot; Right-drag: pan &middot; Scroll: zoom &middot; Click: select
        </span>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default DataGraphPage;
