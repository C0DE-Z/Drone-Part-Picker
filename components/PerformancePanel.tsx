import React from 'react';
import { PerformanceEstimate } from '@/types/drone';

interface PerformancePanelProps {
  performance: PerformanceEstimate;
}

const formatNumber = (value: number, digits = 1): string => {
  if (!Number.isFinite(value)) return '0';
  return value.toFixed(digits);
};

const classifyBuild = (twr: number, topSpeedKmh: number) => {
  if (twr >= 3.2 && topSpeedKmh >= 120) {
    return { label: 'Racing', description: 'High thrust, high-speed profile' };
  }
  if (twr >= 2.6 && topSpeedKmh >= 90) {
    return { label: 'Freestyle', description: 'Strong punch with agile handling' };
  }
  if (twr >= 2.0 && topSpeedKmh >= 70) {
    return { label: 'Sport', description: 'Balanced daily performance' };
  }
  if (twr >= 1.7) {
    return { label: 'Cinematic', description: 'Smooth and controllable setup' };
  }
  return { label: 'Trainer', description: 'Conservative setup for learning' };
};

const StatusChip = ({ ok, label }: { ok: boolean; label: string }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
      ok
        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
        : 'border-rose-300 bg-rose-50 text-rose-700'
    }`}
  >
    {ok ? 'Pass' : 'Fail'}: {label}
  </span>
);

const MetricCard = ({
  label,
  value,
  unit,
  hint
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}) => (
  <div className="rounded-xl border border-slate-200/90 bg-white/90 p-4 shadow-sm shadow-slate-900/5">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
      {value}
      {unit ? <span className="ml-1 text-base font-medium text-slate-500">{unit}</span> : null}
    </p>
    {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm shadow-slate-900/5">
    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{title}</h3>
    <div className="mt-4">{children}</div>
  </section>
);

export default function PerformancePanel({ performance }: PerformancePanelProps) {
  const hoverPower =
    performance.hovering.hoverPowerWatts ??
    performance.hovering.currentDraw * (performance.motors.voltage || 0);

  const hoverEfficiencyGw = hoverPower > 0 ? performance.totalWeight / hoverPower : 0;

  const mixedFlightTime = performance.flightEstimates?.cruise
    ? (performance.flightEstimates.hover + performance.flightEstimates.cruise + performance.flightEstimates.aggressive) / 3
    : performance.estimatedFlightTime;

  const buildClass = classifyBuild(performance.thrustToWeightRatio, performance.estimatedTopSpeed);

  const validationWarnings = performance.validation?.warnings || [];
  const validationFlags = performance.validation?.flags;

  const batteryCLoad =
    performance.battery.capacity > 0
      ? performance.hovering.currentDraw / (performance.battery.capacity / 1000)
      : 0;

  return (
    <div className="w-full space-y-5">
      <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Build classification: {buildClass.label}</h2>
            <p className="text-sm text-slate-600">{buildClass.description}</p>
          </div>
          <p className="text-sm text-slate-600">
            Thrust-to-weight <span className="font-semibold text-slate-900">{formatNumber(performance.thrustToWeightRatio, 2)}:1</span>
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Total thrust"
          value={formatNumber(performance.maxThrust, 2)}
          unit="kg"
          hint={`${Math.round(performance.maxThrustGrams)} g total`}
        />
        <MetricCard
          label="Total weight"
          value={formatNumber(performance.totalWeight, 1)}
          unit="g"
          hint={`${formatNumber(performance.totalWeight / 1000, 3)} kg`}
        />
        <MetricCard
          label="Top speed"
          value={formatNumber(performance.estimatedTopSpeed, 0)}
          unit="km/h"
          hint={`${formatNumber(performance.estimatedTopSpeed * 0.621371, 0)} mph`}
        />
        <MetricCard
          label="Average power"
          value={formatNumber(performance.powerConsumption, 1)}
          unit="W"
          hint="Mixed-flight estimate"
        />
        <MetricCard
          label="Estimated mixed flight"
          value={formatNumber(mixedFlightTime, 1)}
          unit="min"
          hint="Based on configured flight profile"
        />
        <MetricCard
          label="Hover efficiency"
          value={formatNumber(hoverEfficiencyGw, 2)}
          unit="g/W"
          hint="Total mass per hover watt"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Section title="Propulsion">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetricCard
              label="Motor KV"
              value={formatNumber(performance.motors.kv, 0)}
              unit="rpm/V"
              hint={`Nominal RPM ${performance.motors.estimatedRPMNominal?.toLocaleString() || performance.motors.estimatedRPM.toLocaleString()}`}
            />
            <MetricCard
              label="Motor RPM (full)"
              value={formatNumber(performance.motors.estimatedRPMFull || performance.motors.estimatedRPM, 0)}
              unit="rpm"
              hint={`Prop ${performance.motors.propSize}`}
            />
            <MetricCard
              label="Hover throttle"
              value={formatNumber(performance.hovering.throttlePercentage, 1)}
              unit="%"
              hint="Required to hold altitude"
            />
            <MetricCard
              label="Hover current"
              value={formatNumber(performance.hovering.currentDraw, 1)}
              unit="A"
              hint={`Hover power ${formatNumber(hoverPower, 1)} W`}
            />
          </div>
        </Section>

        <Section title="Battery">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetricCard
              label="Battery"
              value={`${performance.battery.cells}S`}
              hint={`${formatNumber(performance.battery.voltage, 1)} V nominal / ${formatNumber(performance.battery.fullVoltage || performance.battery.voltage, 1)} V full`}
            />
            <MetricCard
              label="Capacity"
              value={formatNumber(performance.battery.capacity, 0)}
              unit="mAh"
              hint={`${formatNumber((performance.battery.usableCapacityAh || performance.battery.capacity / 1000), 2)} Ah usable`}
            />
            <MetricCard
              label="Continuous current"
              value={formatNumber(performance.battery.dischargeRate, 1)}
              unit="A"
              hint="From capacity × C-rating"
            />
            <MetricCard
              label="Hover C-load"
              value={formatNumber(batteryCLoad, 2)}
              unit="C"
              hint="Hover current / battery Ah"
            />
          </div>
        </Section>
      </div>

      <Section title="Flight estimates by mode">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard
            label="Hover"
            value={formatNumber(performance.flightEstimates?.hover || performance.hovering.hoverTime, 1)}
            unit="min"
            hint="Steady hover"
          />
          <MetricCard
            label="Cruise"
            value={formatNumber(performance.flightEstimates?.cruise || performance.estimatedFlightTime, 1)}
            unit="min"
            hint="Typical forward flight"
          />
          <MetricCard
            label="Aggressive"
            value={formatNumber(performance.flightEstimates?.aggressive || performance.estimatedFlightTime * 0.75, 1)}
            unit="min"
            hint="High-throttle maneuvers"
          />
        </div>
      </Section>

      <Section title="Compatibility checks">
        <div className="flex flex-wrap gap-2">
          <StatusChip ok={performance.compatibility.propMotorMatch} label="Prop and motor match" />
          <StatusChip ok={performance.compatibility.voltageMatch} label="Voltage compatibility" />
          <StatusChip ok={performance.compatibility.mountingMatch} label="Mounting compatibility" />
          <StatusChip ok={performance.compatibility.frameStackMatch} label="Frame and stack fit" />
        </div>
      </Section>

      <Section title="Validation and realism checks">
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            Model status:{' '}
            <span className={performance.validation?.isRealistic ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>
              {performance.validation?.isRealistic ? 'Within expected FPV range' : 'Potentially unrealistic output'}
            </span>
          </p>

          {validationFlags ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <StatusChip ok={!validationFlags.thrustTooLow} label="Minimum thrust margin" />
              <StatusChip ok={!validationFlags.thrustTooHigh} label="Maximum thrust sanity" />
              <StatusChip ok={!validationFlags.hoverThrottleTooHigh} label="Hover throttle envelope" />
              <StatusChip ok={!validationFlags.currentExceedsBatteryCapability} label="Battery current capability" />
              <StatusChip ok={!validationFlags.flightTimeOutOfRange} label="Flight-time realism" />
              <StatusChip ok={!validationFlags.topSpeedOutOfRange} label="Top-speed realism" />
            </div>
          ) : null}

          {validationWarnings.length > 0 ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-800">Review recommended</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                {validationWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
              No abnormal behavior flags were raised by the current validation rules.
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
