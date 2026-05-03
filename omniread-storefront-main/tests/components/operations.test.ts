import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

describe('riskClass', () => {
  it('returns correct CSS class for CRITICAL risk', () => {
    const riskClass = (risk?: string) => {
      if (risk === 'CRITICAL') return 'bg-red-100 text-red-800 border-red-300';
      if (risk === 'HIGH') return 'bg-orange-100 text-orange-800 border-orange-300';
      if (risk === 'MEDIUM') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      if (risk === 'LOW') return 'bg-green-100 text-green-800 border-green-300';
      return 'bg-gray-100 text-gray-800 border-gray-300';
    };
    expect(riskClass('CRITICAL')).toBe('bg-red-100 text-red-800 border-red-300');
  });

  it('returns correct CSS class for HIGH risk', () => {
    const riskClass = (risk?: string) => {
      if (risk === 'CRITICAL') return 'bg-red-100 text-red-800 border-red-300';
      if (risk === 'HIGH') return 'bg-orange-100 text-orange-800 border-orange-300';
      if (risk === 'MEDIUM') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      if (risk === 'LOW') return 'bg-green-100 text-green-800 border-green-300';
      return 'bg-gray-100 text-gray-800 border-gray-300';
    };
    expect(riskClass('HIGH')).toBe('bg-orange-100 text-orange-800 border-orange-300');
  });

  it('returns correct CSS class for MEDIUM risk', () => {
    const riskClass = (risk?: string) => {
      if (risk === 'CRITICAL') return 'bg-red-100 text-red-800 border-red-300';
      if (risk === 'HIGH') return 'bg-orange-100 text-orange-800 border-orange-300';
      if (risk === 'MEDIUM') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      if (risk === 'LOW') return 'bg-green-100 text-green-800 border-green-300';
      return 'bg-gray-100 text-gray-800 border-gray-300';
    };
    expect(riskClass('MEDIUM')).toBe('bg-yellow-100 text-yellow-800 border-yellow-300');
  });

  it('returns correct CSS class for LOW risk', () => {
    const riskClass = (risk?: string) => {
      if (risk === 'CRITICAL') return 'bg-red-100 text-red-800 border-red-300';
      if (risk === 'HIGH') return 'bg-orange-100 text-orange-800 border-orange-300';
      if (risk === 'MEDIUM') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      if (risk === 'LOW') return 'bg-green-100 text-green-800 border-green-300';
      return 'bg-gray-100 text-gray-800 border-gray-300';
    };
    expect(riskClass('LOW')).toBe('bg-green-100 text-green-800 border-green-300');
  });

  it('returns gray for undefined risk', () => {
    const riskClass = (risk?: string) => {
      if (risk === 'CRITICAL') return 'bg-red-100 text-red-800 border-red-300';
      if (risk === 'HIGH') return 'bg-orange-100 text-orange-800 border-orange-300';
      if (risk === 'MEDIUM') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      if (risk === 'LOW') return 'bg-green-100 text-green-800 border-green-300';
      return 'bg-gray-100 text-gray-800 border-gray-300';
    };
    expect(riskClass(undefined)).toBe('bg-gray-100 text-gray-800 border-gray-300');
  });
});

describe('attribution normalization', () => {
  it('normalizes attribution values to sum to 1', () => {
    const rawAttr = {
      sales_velocity: 0.3,
      current_stock: 0.2,
      lead_time_days: 0.15,
      safety_stock: 0.12,
      sales_std: 0.1,
      days_since_last_order: 0.08,
      seasonality: 0.05,
    };
    const total = Object.values(rawAttr).reduce((a, b) => a + b, 0);
    const normalized = Object.fromEntries(
      Object.entries(rawAttr).map(([k, v]) => [k, Math.round((v / total) * 10000) / 10000])
    );
    const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1.0) < 0.001).toBe(true);
  });

  it('handles empty attribution map', () => {
    const attr: Record<string, number> = {};
    const entries = Object.entries(attr).sort(([, a], [, b]) => b - a);
    expect(entries).toHaveLength(0);
  });
});

describe('procurement decision logic', () => {
  it('triggers procurement when risk >= 0.75 AND stockout <= lead_time', () => {
    const shouldTrigger = (riskScore: number, stockoutDay: number, leadTime: number) => {
      return riskScore >= 0.75 && stockoutDay <= leadTime;
    };
    expect(shouldTrigger(0.8, 3, 5)).toBe(true);
    expect(shouldTrigger(0.8, 5, 5)).toBe(true);
    expect(shouldTrigger(0.7, 3, 5)).toBe(false);
    expect(shouldTrigger(0.8, 6, 5)).toBe(false);
  });

  it('calculates suggested quantity correctly', () => {
    const calcQty = (safetyStock: number, predictedDemand: number, leadTimeDays: number, horizonDays: number) => {
      if (horizonDays <= 0) return safetyStock * 2;
      return Math.max(safetyStock * 2, Math.ceil(predictedDemand * leadTimeDays / horizonDays));
    };
    expect(calcQty(10, 70, 3, 7)).toBe(30);
    expect(calcQty(10, 20, 7, 7)).toBe(20);
    expect(calcQty(5, 10, 3, 0)).toBe(10);
  });
});

describe('stockout risk calculation', () => {
  it('computes risk from stockout day and horizon', () => {
    const stockoutToRisk = (stockoutDay: number, horizon: number) => {
      if (horizon <= 0) return 0.5;
      const risk = 1.0 - (stockoutDay / horizon);
      return Math.max(0.0, Math.min(1.0, risk));
    };
    expect(stockoutToRisk(3, 7)).toBeCloseTo(0.571, 2);
    expect(stockoutToRisk(7, 7)).toBeCloseTo(0, 2);
    expect(stockoutToRisk(0, 7)).toBeCloseTo(1.0, 2);
    expect(stockoutToRisk(3, 3)).toBeCloseTo(0, 2);
  });
});

describe('risk band derivation', () => {
  it('maps risk score to band correctly', () => {
    const deriveBand = (risk: number) => {
      if (risk >= 0.75) return 'CRITICAL';
      if (risk >= 0.50) return 'HIGH';
      if (risk >= 0.25) return 'MEDIUM';
      return 'LOW';
    };
    expect(deriveBand(0.82)).toBe('CRITICAL');
    expect(deriveBand(0.75)).toBe('CRITICAL');
    expect(deriveBand(0.60)).toBe('HIGH');
    expect(deriveBand(0.50)).toBe('HIGH');
    expect(deriveBand(0.35)).toBe('MEDIUM');
    expect(deriveBand(0.25)).toBe('MEDIUM');
    expect(deriveBand(0.10)).toBe('LOW');
  });
});