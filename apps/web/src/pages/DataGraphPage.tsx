import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
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
  { id: 'equip-1', label: 'Standard Porta-John #1-10', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: 'Porta-Johns (10 units)' },
  { id: 'equip-2', label: 'Deluxe Porta-John #1-5', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: 'Porta-Johns (5 units)' },
  { id: 'equip-3', label: 'ADA Porta-John #1-3', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: 'Porta-Johns (3 units)' },
  { id: 'equip-4', label: 'Hand Wash Station A', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: 'Hand Wash Station' },
  { id: 'equip-5', label: 'Hand Wash Station B', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: 'Hand Wash Station' },
  { id: 'equip-6', label: 'Flatbed Trailer T-01', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: 'Transport Trailer' },
  { id: 'equip-7', label: 'Flatbed Trailer T-02', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: 'Transport Trailer' },
  { id: 'equip-8', label: 'Pump Truck P-01', category: 'Equipment', color: CATEGORY_COLORS['Equipment'], size: CATEGORY_SIZES['Equipment'], detail: 'Vacuum Pump Truck' },
];

// Locations (15 representative)
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
  // Employee → Department
  ...employees.filter(e => e.category === 'Driver').map(e => ({ source: e.id, target: 'dept-1', label: 'belongs to' })),
  ...employees.filter(e => e.category === 'Service Crew').map(e => ({ source: e.id, target: 'dept-2', label: 'belongs to' })),
  ...employees.filter(e => e.category === 'Office').map(e => ({ source: e.id, target: 'dept-3', label: 'belongs to' })),

  // Employee → Project (2-3 projects per employee)
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

  // Project → Customer
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

  // Project → Location
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

  // Equipment → Location
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

  // Employee → Time Category
  ...employees.map(e => ({ source: e.id, target: 'tc-1', label: 'regular hours' })),
  ...employees.filter((_, i) => i % 2 === 0).map(e => ({ source: e.id, target: 'tc-2', label: 'overtime hours' })),
  ...employees.filter((_, i) => i % 5 === 0).map(e => ({ source: e.id, target: 'tc-3', label: 'double time hours' })),
];

// ─── LEGEND DATA ───────────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { label: 'Drivers', color: '#f89020' },
  { label: 'Service Crew', color: '#f97316' },
  { label: 'Office', color: '#fb923c' },
  { label: 'Projects', color: '#0a1f44' },
  { label: 'Customers', color: '#3b82f6' },
  { label: 'Equipment', color: '#22c55e' },
  { label: 'Locations', color: '#8b5cf6' },
  { label: 'Departments', color: '#14b8a6' },
  { label: 'Time Cat.', color: '#ef4444' },
];

// ─── FORCE SIMULATION ──────────────────────────────────────────────────────────

interface SimNode {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

function initSimulation(nodes: GraphNode[]): SimNode[] {
  return nodes.map((_, i) => {
    const phi = Math.acos(1 - 2 * (i + 0.5) / nodes.length);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 12;
    return {
      id: nodes[i].id,
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
      vx: 0, vy: 0, vz: 0,
    };
  });
}

function stepSimulation(simNodes: SimNode[], graphEdges: GraphEdge[], _dt: number) {
  const REPULSION = 80;
  const ATTRACTION = 0.008;
  const DAMPING = 0.92;
  const MIN_DIST = 1.5;
  const dt = 1;

  const n = simNodes.length;
  // Repulsion (Coulomb)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = simNodes[i].x - simNodes[j].x;
      const dy = simNodes[i].y - simNodes[j].y;
      const dz = simNodes[i].z - simNodes[j].z;
      let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < MIN_DIST) dist = MIN_DIST;
      const force = REPULSION / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      const fz = (dz / dist) * force;
      simNodes[i].vx += fx * dt;
      simNodes[i].vy += fy * dt;
      simNodes[i].vz += fz * dt;
      simNodes[j].vx -= fx * dt;
      simNodes[j].vy -= fy * dt;
      simNodes[j].vz -= fz * dt;
    }
  }

  // Attraction along edges (Hooke)
  const idxMap: Record<string, number> = {};
  for (let i = 0; i < n; i++) idxMap[simNodes[i].id] = i;

  for (const edge of graphEdges) {
    const si = idxMap[edge.source];
    const ti = idxMap[edge.target];
    if (si === undefined || ti === undefined) continue;
    const dx = simNodes[ti].x - simNodes[si].x;
    const dy = simNodes[ti].y - simNodes[si].y;
    const dz = simNodes[ti].z - simNodes[si].z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 0.01) continue;
    const force = ATTRACTION * (dist - 5); // rest length = 5
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    const fz = (dz / dist) * force;
    simNodes[si].vx += fx * dt;
    simNodes[si].vy += fy * dt;
    simNodes[si].vz += fz * dt;
    simNodes[ti].vx -= fx * dt;
    simNodes[ti].vy -= fy * dt;
    simNodes[ti].vz -= fz * dt;
  }

  // Center gravity — pull towards origin
  for (let i = 0; i < n; i++) {
    simNodes[i].vx -= simNodes[i].x * 0.001;
    simNodes[i].vy -= simNodes[i].y * 0.001;
    simNodes[i].vz -= simNodes[i].z * 0.001;
  }

  // Apply velocity with damping
  for (let i = 0; i < n; i++) {
    simNodes[i].vx *= DAMPING;
    simNodes[i].vy *= DAMPING;
    simNodes[i].vz *= DAMPING;
    simNodes[i].x += simNodes[i].vx * dt;
    simNodes[i].y += simNodes[i].vy * dt;
    simNodes[i].z += simNodes[i].vz * dt;
  }
}

// ─── 3D COMPONENTS ─────────────────────────────────────────────────────────────

interface NodeSphereProps {
  node: GraphNode;
  position: [number, number, number];
  selected: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
  time: number;
  bobOffset: number;
}

function NodeSphere({ node, position, selected, dimmed, onSelect, time, bobOffset }: NodeSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const bobY = Math.sin(time * 0.5 + bobOffset) * 0.15;
  const pos: [number, number, number] = [position[0], position[1] + bobY, position[2]];

  const opacity = dimmed ? 0.12 : 1;
  const emissiveIntensity = selected ? 0.6 : hovered ? 0.3 : 0;
  const scale = selected ? 1.3 : hovered ? 1.15 : 1;

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(node.id);
  }, [node.id, onSelect]);

  return (
    <mesh
      ref={meshRef}
      position={pos}
      scale={scale}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[node.size, 24, 24]} />
      <meshStandardMaterial
        color={node.color}
        transparent
        opacity={opacity}
        emissive={node.color}
        emissiveIntensity={emissiveIntensity}
      />
      {(selected || hovered) && !dimmed && (
        <Html distanceFactor={20} style={{ pointerEvents: 'none' }}>
          <div className="bg-gray-900/95 text-white px-3 py-2 rounded-lg shadow-xl text-xs whitespace-nowrap -translate-x-1/2 -translate-y-full mb-2 border border-gray-700">
            <div className="font-bold text-sm">{node.label}</div>
            <div className="text-gray-400">{node.category}</div>
            {node.detail && <div className="text-gray-300 mt-0.5">{node.detail}</div>}
          </div>
        </Html>
      )}
    </mesh>
  );
}

interface EdgeLineProps {
  from: [number, number, number];
  to: [number, number, number];
  dimmed: boolean;
  highlighted: boolean;
  time: number;
  bobOffsetFrom: number;
  bobOffsetTo: number;
}

function EdgeLine({ from, to, dimmed, highlighted, time, bobOffsetFrom, bobOffsetTo }: EdgeLineProps) {
  const fromBob: [number, number, number] = [from[0], from[1] + Math.sin(time * 0.5 + bobOffsetFrom) * 0.15, from[2]];
  const toBob: [number, number, number] = [to[0], to[1] + Math.sin(time * 0.5 + bobOffsetTo) * 0.15, to[2]];

  const color = highlighted ? '#f89020' : '#6b7280';
  const opacity = dimmed ? 0.04 : highlighted ? 0.8 : 0.2;
  const lineWidth = highlighted ? 2 : 1;

  return (
    <Line
      points={[fromBob, toBob]}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={opacity}
    />
  );
}

interface GraphSceneProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onResetCamera: React.MutableRefObject<(() => void) | null>;
}

function GraphScene({ selectedId, onSelect, onResetCamera }: GraphSceneProps) {
  const simRef = useRef<SimNode[]>(initSimulation(allNodes));
  const iterRef = useRef(0);
  const timeRef = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  // Bob offset per node (stable random)
  const bobOffsets = useMemo(() => allNodes.map((_, i) => i * 1.37), []);

  // Position lookup
  const posMap = useRef<Record<string, [number, number, number]>>({});

  // Build adjacency for highlight
  const adjacency = useMemo(() => {
    const adj: Record<string, Set<string>> = {};
    for (const n of allNodes) adj[n.id] = new Set();
    for (const e of edges) {
      adj[e.source]?.add(e.target);
      adj[e.target]?.add(e.source);
    }
    return adj;
  }, []);

  const highlightSet = useMemo(() => {
    if (!selectedId) return null;
    const s = new Set<string>();
    s.add(selectedId);
    adjacency[selectedId]?.forEach(id => s.add(id));
    return s;
  }, [selectedId, adjacency]);

  const highlightEdgeSet = useMemo(() => {
    if (!selectedId) return null;
    const s = new Set<string>();
    for (const e of edges) {
      if (e.source === selectedId || e.target === selectedId) {
        s.add(`${e.source}--${e.target}`);
      }
    }
    return s;
  }, [selectedId]);

  // Reset camera
  useEffect(() => {
    onResetCamera.current = () => {
      camera.position.set(0, 0, 40);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    };
  }, [camera, onResetCamera]);

  // Force frame loop
  const [, setTick] = useState(0);
  useFrame((_, delta) => {
    timeRef.current += delta;

    // Run simulation (reduce iterations over time for stability)
    if (iterRef.current < 300) {
      const steps = iterRef.current < 100 ? 3 : 1;
      for (let s = 0; s < steps; s++) {
        stepSimulation(simRef.current, edges, 1);
      }
      iterRef.current += 1;
    }

    // Update position map
    for (let i = 0; i < simRef.current.length; i++) {
      const sn = simRef.current[i];
      posMap.current[sn.id] = [sn.x, sn.y, sn.z];
    }

    // Trigger re-render
    setTick(t => t + 1);
  });

  const handleBackgroundClick = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  const nodeIdxMap = useMemo(() => {
    const m: Record<string, number> = {};
    allNodes.forEach((n, i) => m[n.id] = i);
    return m;
  }, []);

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[30, 30, 30]} intensity={1} />
      <pointLight position={[-30, -30, -30]} intensity={0.4} />

      {/* Background click plane */}
      <mesh position={[0, 0, -50]} onClick={handleBackgroundClick}>
        <planeGeometry args={[500, 500]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Edges */}
      {edges.map((edge, i) => {
        const from = posMap.current[edge.source] || [0, 0, 0] as [number, number, number];
        const to = posMap.current[edge.target] || [0, 0, 0] as [number, number, number];
        const eKey = `${edge.source}--${edge.target}`;
        const highlighted = highlightEdgeSet ? highlightEdgeSet.has(eKey) : false;
        const dimmed = highlightEdgeSet ? !highlighted : false;
        return (
          <EdgeLine
            key={`edge-${i}`}
            from={from}
            to={to}
            dimmed={dimmed}
            highlighted={highlighted}
            time={timeRef.current}
            bobOffsetFrom={bobOffsets[nodeIdxMap[edge.source]] || 0}
            bobOffsetTo={bobOffsets[nodeIdxMap[edge.target]] || 0}
          />
        );
      })}

      {/* Nodes */}
      {allNodes.map((node, i) => {
        const pos = posMap.current[node.id] || [0, 0, 0] as [number, number, number];
        const isSelected = selectedId === node.id;
        const dimmed = highlightSet ? !highlightSet.has(node.id) : false;
        return (
          <NodeSphere
            key={node.id}
            node={node}
            position={pos}
            selected={isSelected}
            dimmed={dimmed}
            onSelect={onSelect}
            time={timeRef.current}
            bobOffset={bobOffsets[i]}
          />
        );
      })}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.8}
        panSpeed={0.8}
        zoomSpeed={0.8}
      />
    </>
  );
}

// ─── INFO PANEL ────────────────────────────────────────────────────────────────

function InfoPanel({ nodeId }: { nodeId: string }) {
  const node = allNodes.find(n => n.id === nodeId);
  if (!node) return null;

  const connections = edges
    .filter(e => e.source === nodeId || e.target === nodeId)
    .map(e => {
      const otherId = e.source === nodeId ? e.target : e.source;
      const other = allNodes.find(n => n.id === otherId);
      return { label: e.label, node: other };
    })
    .filter(c => c.node);

  // Group connections by label
  const grouped: Record<string, string[]> = {};
  for (const c of connections) {
    if (!grouped[c.label]) grouped[c.label] = [];
    grouped[c.label].push(c.node!.label);
  }

  return (
    <div className="absolute top-20 right-4 w-72 bg-gray-900/95 text-white rounded-xl shadow-2xl border border-gray-700 p-4 z-20 overflow-auto max-h-[60vh]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: node.color }} />
        <h3 className="font-bold text-base">{node.label}</h3>
      </div>
      <div className="text-gray-400 text-xs mb-1">{node.category}</div>
      {node.detail && <div className="text-gray-300 text-xs mb-3">{node.detail}</div>}

      <div className="border-t border-gray-700 pt-2">
        <div className="text-gray-500 text-[10px] uppercase tracking-wide mb-1">Connections ({connections.length})</div>
        {Object.entries(grouped).map(([rel, names]) => (
          <div key={rel} className="mb-2">
            <div className="text-gray-400 text-[11px] italic">{rel}</div>
            {names.slice(0, 8).map((name, i) => (
              <div key={i} className="text-gray-200 text-xs pl-2">{name}</div>
            ))}
            {names.length > 8 && <div className="text-gray-500 text-xs pl-2">+{names.length - 8} more</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export function DataGraphPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);

  return (
    <div className="h-screen font-display flex flex-col overflow-hidden" style={{ background: '#111827' }}>
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
            <span className="bg-red-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
              Experimental
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Interactive 3D force-directed graph of all operational data entities
          </p>
        </div>
        <button
          onClick={() => resetCameraRef.current?.()}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
          title="Reset camera"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset View</span>
        </button>
      </header>

      {/* Canvas — fills all remaining space */}
      <div className="flex-1 relative">
        {/* Faint ServiceCore watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
          <span
            className="text-[8vw] font-black uppercase tracking-[0.2em]"
            style={{ color: 'rgba(255,255,255,0.03)' }}
          >
            ServiceCore
          </span>
        </div>

        <Canvas
          camera={{ position: [0, 0, 40], fov: 60 }}
          style={{ background: '#111827', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          onPointerMissed={() => setSelectedId(null)}
        >
          <GraphScene
            selectedId={selectedId}
            onSelect={setSelectedId}
            onResetCamera={resetCameraRef}
          />
        </Canvas>

        {/* Info Panel */}
        {selectedId && <InfoPanel nodeId={selectedId} />}
      </div>

      {/* Legend + Controls — compact footer */}
      <div className="bg-gray-900/90 backdrop-blur border-t border-gray-800 px-6 py-2 flex items-center justify-between relative z-30 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          {LEGEND_ITEMS.map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-gray-400 text-[11px]">{item.label}</span>
            </div>
          ))}
        </div>
        <span className="text-gray-600 text-[11px] hidden md:block">
          Drag: rotate · Right-drag: pan · Scroll: zoom · Click: select
        </span>
      </div>
    </div>
  );
}

export default DataGraphPage;
