import React from 'react';
import { PerformanceEstimate } from '@/types/drone';

interface PerformancePanelProps {
  performance: PerformanceEstimate;
}

const formatNumber = (value: number, digits = 1): string => {
  if (!Number.isFinite(value)) return '0';
  return value.toFixed(digits);
};

const formatSeconds = (seconds: number | null): string => {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return 'N/A';
  return `${seconds < 10 ? seconds.toFixed(2) : seconds.toFixed(1)} s`;
};

const parsePropSizeInches = (propSize: string | undefined): number => {
  if (!propSize) return 5;
  const match = propSize.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 5;
  const parsed = parseFloat(match[1]);
  if (!Number.isFinite(parsed)) return 5;
  return Math.max(1, Math.min(14, parsed));
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

const CalculationRow = ({
  label,
  equation,
  result,
  note
}: {
  label: string;
  equation: string;
  result: string;
  note?: string;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 font-mono text-xs text-slate-700 sm:text-sm">{equation}</p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{result}</p>
    {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
  </div>
);

const MiniBarChart = ({
  title,
  unit,
  rows,
  tone
}: {
  title: string;
  unit: string;
  rows: Array<{ label: string; value: number }>;
  tone: 'blue' | 'emerald' | 'violet' | 'amber';
}) => {
  const max = Math.max(...rows.map((row) => row.value), 1);

  const toneClasses: Record<typeof tone, string> = {
    blue: 'from-blue-500 to-indigo-500',
    emerald: 'from-emerald-500 to-teal-500',
    violet: 'from-violet-500 to-purple-500',
    amber: 'from-amber-500 to-orange-500'
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <div className="mt-3 space-y-3">
        {rows.map((row) => {
          const width = Math.max((row.value / max) * 100, 3);
          return (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">{row.label}</span>
                <span className="font-semibold text-slate-800">{formatNumber(row.value, 2)} {unit}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${toneClasses[tone]}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface DynamicsSample {
  t: number;
  speedKmh: number;
  distanceM: number;
  accel: number;
}

const safeAtanh = (x: number): number => {
  const clamped = Math.max(-0.999999, Math.min(0.999999, x));
  return 0.5 * Math.log((1 + clamped) / (1 - clamped));
};

const safeAcosh = (x: number): number => {
  const clamped = Math.max(1, x);
  return Math.log(clamped + Math.sqrt(clamped * clamped - 1));
};

const getForwardLaunchCap = (propSizeIn: number, topSpeedKmh: number): number => {
  // Forward acceleration is much lower than static thrust-derived vertical acceleration.
  // Calibrated for practical FPV log ranges by prop class.
  let base = 11.5;

  if (propSizeIn <= 2.5) base = 4.8;
  else if (propSizeIn <= 3.5) base = 6.8;
  else if (propSizeIn <= 4.5) base = 9.0;
  else if (propSizeIn <= 5.5) base = 11.5;
  else if (propSizeIn <= 7.5) base = 10.8;
  else base = 9.5;

  const speedFactor = Math.max(0.85, Math.min(1.1, 0.9 + topSpeedKmh / 320));
  return base * speedFactor;
};

const buildDynamics = (
  thrustToWeightRatio: number,
  estimatedTopSpeedKmh: number,
  propSizeIn: number
): {
  effectiveLaunchAccel: number;
  accelCap: number;
  launchAccel: number;
  launchG: number;
  zeroTo50: number | null;
  zeroTo100: number | null;
  zeroTo150: number | null;
  sixtyTo120: number | null;
  sprint100m: number | null;
  timeTo90Top: number | null;
  samples: DynamicsSample[];
} => {
  const g = 9.80665;
  const rawA0 = Math.max((thrustToWeightRatio - 1) * g, 0);
  const vMax = Math.max(estimatedTopSpeedKmh / 3.6, 0);

  const accelCap = getForwardLaunchCap(propSizeIn, estimatedTopSpeedKmh);
  const effectiveA0 = Math.max(2, Math.min(rawA0 * 0.42, accelCap));

  if (effectiveA0 <= 0 || vMax <= 0) {
    return {
      effectiveLaunchAccel: 0,
      accelCap,
      launchAccel: 0,
      launchG: 0,
      zeroTo50: null,
      zeroTo100: null,
      zeroTo150: null,
      sixtyTo120: null,
      sprint100m: null,
      timeTo90Top: null,
      samples: []
    };
  }

  const timeToSpeed = (targetKmh: number): number | null => {
    const targetMs = targetKmh / 3.6;
    if (targetMs >= vMax * 0.995) return null;
    return (vMax / effectiveA0) * safeAtanh(targetMs / vMax);
  };

  const timeToDistance = (distanceM: number): number | null => {
    if (distanceM <= 0) return 0;
    const expo = (distanceM * effectiveA0) / (vMax * vMax);
    if (!Number.isFinite(expo) || expo > 50) return null;
    const coshArg = Math.exp(expo);
    return (vMax / effectiveA0) * safeAcosh(coshArg);
  };

  const horizonS = Math.max(10, Math.min(35, (vMax / effectiveA0) * 3.9));
  const sampleCount = 40;
  const dt = horizonS / sampleCount;
  const samples: DynamicsSample[] = [];

  for (let i = 0; i <= sampleCount; i += 1) {
    const t = i * dt;
    const arg = Math.min((effectiveA0 * t) / vMax, 9);
    const tanh = Math.tanh(arg);
    const v = vMax * tanh;
    const distanceM = (vMax * vMax / effectiveA0) * Math.log(Math.cosh(arg));
    const accel = effectiveA0 * (1 - tanh * tanh);

    samples.push({
      t,
      speedKmh: v * 3.6,
      distanceM,
      accel
    });
  }

  const t60 = timeToSpeed(60);
  const t120 = timeToSpeed(120);
  const sixtyTo120 = t60 !== null && t120 !== null ? Math.max(0, t120 - t60) : null;

  return {
    effectiveLaunchAccel: effectiveA0,
    accelCap,
    launchAccel: rawA0,
    launchG: effectiveA0 / g,
    zeroTo50: timeToSpeed(50),
    zeroTo100: timeToSpeed(100),
    zeroTo150: timeToSpeed(150),
    sixtyTo120,
    sprint100m: timeToDistance(100),
    timeTo90Top: (vMax / effectiveA0) * safeAtanh(0.9),
    samples
  };
};

const MiniLineChart = ({
  title,
  subtitle,
  points,
  xUnit,
  yUnit,
  stroke
}: {
  title: string;
  subtitle: string;
  points: Array<{ x: number; y: number }>;
  xUnit: string;
  yUnit: string;
  stroke: string;
}) => {
  if (points.length < 2) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        <p className="mt-6 text-sm text-slate-500">Not enough data for curve.</p>
      </div>
    );
  }

  const width = 320;
  const height = 170;
  const padLeft = 34;
  const padRight = 12;
  const padTop = 10;
  const padBottom = 24;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const xMax = Math.max(...points.map((p) => p.x), 1);
  const yMax = Math.max(...points.map((p) => p.y), 1);

  const toSvgX = (x: number) => padLeft + (x / xMax) * plotW;
  const toSvgY = (y: number) => padTop + plotH - (y / yMax) * plotH;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.x).toFixed(2)} ${toSvgY(p.y).toFixed(2)}`)
    .join(' ');

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-100 bg-slate-50/50">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[180px] w-full">
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = padTop + plotH - tick * plotH;
            return <line key={`y-${tick}`} x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
          })}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const x = padLeft + tick * plotW;
            return <line key={`x-${tick}`} x1={x} x2={x} y1={padTop} y2={padTop + plotH} stroke="#f1f5f9" strokeWidth="1" />;
          })}

          <line x1={padLeft} x2={padLeft} y1={padTop} y2={padTop + plotH} stroke="#94a3b8" strokeWidth="1.2" />
          <line x1={padLeft} x2={width - padRight} y1={padTop + plotH} y2={padTop + plotH} stroke="#94a3b8" strokeWidth="1.2" />

          <path d={pathD} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          <text x={padLeft} y={height - 6} fontSize="10" fill="#64748b">0 {xUnit}</text>
          <text x={width - padRight - 30} y={height - 6} fontSize="10" fill="#64748b">{formatNumber(xMax, 1)} {xUnit}</text>
          <text x={4} y={padTop + 10} fontSize="10" fill="#64748b">{formatNumber(yMax, 1)} {yUnit}</text>
        </svg>
      </div>
    </div>
  );
};

export default function PerformancePanel({ performance }: PerformancePanelProps) {
  const hoverPower =
    performance.hovering.hoverPowerWatts ??
    performance.hovering.currentDraw * (performance.motors.voltage || 0);

  const nominalVoltage = performance.battery.voltage || performance.motors.voltage || 0;
  const usableCapacityAh = performance.battery.usableCapacityAh ?? (performance.battery.capacity / 1000);
  const usableEnergyWh = usableCapacityAh * nominalVoltage;
  const weightN = (performance.totalWeight / 1000) * 9.80665;
  const thrustN = (performance.maxThrustGrams / 1000) * 9.80665;
  const mixedCurrent = nominalVoltage > 0 ? performance.powerConsumption / nominalVoltage : 0;

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

  const hoverMin = performance.flightEstimates?.hover || performance.hovering.hoverTime || 0;
  const cruiseMin = performance.flightEstimates?.cruise || performance.estimatedFlightTime || 0;
  const aggressiveMin = performance.flightEstimates?.aggressive || performance.estimatedFlightTime * 0.75;

  const toModeCurrent = (minutes: number): number => {
    if (!Number.isFinite(minutes) || minutes <= 0 || usableCapacityAh <= 0) return 0;
    return usableCapacityAh / (minutes / 60);
  };

  const modeCurrents = {
    hover: toModeCurrent(hoverMin),
    cruise: toModeCurrent(cruiseMin),
    aggressive: toModeCurrent(aggressiveMin)
  };

  const modePowers = {
    hover: modeCurrents.hover * nominalVoltage,
    cruise: modeCurrents.cruise * nominalVoltage,
    aggressive: modeCurrents.aggressive * nominalVoltage
  };

  const twrFromForces = weightN > 0 ? thrustN / weightN : 0;
  const propSizeIn = parsePropSizeInches(performance.motors.propSize);
  const dynamics = buildDynamics(performance.thrustToWeightRatio, performance.estimatedTopSpeed, propSizeIn);

  const speedTimePoints = dynamics.samples.map((sample) => ({ x: sample.t, y: sample.speedKmh }));
  const distanceTimePoints = dynamics.samples.map((sample) => ({ x: sample.t, y: sample.distanceM }));
  const accelerationSpeedPoints = dynamics.samples.map((sample) => ({ x: sample.speedKmh, y: sample.accel }));

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

      <Section title="Underlying math and graphs">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            These calculations are generated from the same SI model used by the estimator and are shown so you can audit the numbers.
          </p>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <CalculationRow
              label="Thrust-to-weight ratio"
              equation={`TWR = thrust / weight = ${formatNumber(thrustN, 2)} N / ${formatNumber(weightN, 2)} N`}
              result={`${formatNumber(twrFromForces, 2)} : 1`}
              note="Should match the displayed TWR metric."
            />
            <CalculationRow
              label="Hover power"
              equation={`P_hover = I_hover × V = ${formatNumber(performance.hovering.currentDraw, 2)} A × ${formatNumber(nominalVoltage, 2)} V`}
              result={`${formatNumber(hoverPower, 1)} W`}
              note="Electrical input power at hover operating point."
            />
            <CalculationRow
              label="Usable battery energy"
              equation={`E_usable = Ah_usable × V_nominal = ${formatNumber(usableCapacityAh, 2)} Ah × ${formatNumber(nominalVoltage, 2)} V`}
              result={`${formatNumber(usableEnergyWh, 1)} Wh`}
              note="Capacity already includes usable-capacity, age, and temperature effects."
            />
            <CalculationRow
              label="Mixed flight time"
              equation={`t_mixed = (Ah_usable / I_mixed) × 60 = (${formatNumber(usableCapacityAh, 2)} / ${formatNumber(mixedCurrent, 2)}) × 60`}
              result={`${formatNumber(mixedFlightTime, 1)} min`}
              note="I_mixed is derived from mixed-mode average power and nominal voltage."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <MiniBarChart
              title="Current by flight mode"
              unit="A"
              tone="blue"
              rows={[
                { label: 'Hover', value: modeCurrents.hover },
                { label: 'Cruise', value: modeCurrents.cruise },
                { label: 'Aggressive', value: modeCurrents.aggressive }
              ]}
            />
            <MiniBarChart
              title="Power by flight mode"
              unit="W"
              tone="violet"
              rows={[
                { label: 'Hover', value: modePowers.hover },
                { label: 'Cruise', value: modePowers.cruise },
                { label: 'Aggressive', value: modePowers.aggressive }
              ]}
            />
            <MiniBarChart
              title="Flight time by mode"
              unit="min"
              tone="emerald"
              rows={[
                { label: 'Hover', value: hoverMin },
                { label: 'Cruise', value: cruiseMin },
                { label: 'Aggressive', value: aggressiveMin },
                { label: 'Mixed', value: mixedFlightTime }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <CalculationRow
              label="Acceleration model"
              equation={`a_eff = min(0.42×(TWR-1)g, cap(prop,size,speed)), then dv/dt = a_eff(1 - (v/vmax)^2)`}
              result={`Effective launch acceleration ≈ ${formatNumber(dynamics.effectiveLaunchAccel, 2)} m/s² (${formatNumber(dynamics.launchG, 2)} g)`}
              note={`Raw thrust-based accel ${formatNumber(dynamics.launchAccel, 1)} m/s², capped to ${formatNumber(dynamics.accelCap, 1)} m/s² for real-world forward flight.`}
            />
            <CalculationRow
              label="0-100 estimate"
              equation={`t = (vmax/a0) × atanh(v/vmax), with vmax = ${formatNumber(performance.estimatedTopSpeed / 3.6, 2)} m/s`}
              result={`0-100 km/h ≈ ${formatSeconds(dynamics.zeroTo100)}`}
              note="Full-throttle straight-line estimate in no-wind conditions."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="0-50 km/h"
              value={formatSeconds(dynamics.zeroTo50)}
              hint="Standing-start sprint"
            />
            <MetricCard
              label="0-100 km/h"
              value={formatSeconds(dynamics.zeroTo100)}
              hint="Most useful FPV sprint benchmark"
            />
            <MetricCard
              label="0-150 km/h"
              value={formatSeconds(dynamics.zeroTo150)}
              hint="Displayed when top-speed allows"
            />
            <MetricCard
              label="60-120 km/h"
              value={formatSeconds(dynamics.sixtyTo120)}
              hint="Mid-range punch estimate"
            />
            <MetricCard
              label="100m sprint"
              value={formatSeconds(dynamics.sprint100m)}
              hint="Straight-line 100m run"
            />
            <MetricCard
              label="Time to 90% top speed"
              value={formatSeconds(dynamics.timeTo90Top)}
              hint="Near-terminal acceleration point"
            />
            <MetricCard
              label="Launch acceleration"
              value={formatNumber(dynamics.effectiveLaunchAccel, 2)}
              unit="m/s²"
              hint={`${formatNumber(dynamics.launchG, 2)} g equivalent`}
            />
            <MetricCard
              label="Speed ceiling used"
              value={formatNumber(performance.estimatedTopSpeed, 0)}
              unit="km/h"
              hint="From SI drag + pitch-limited estimator"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <MiniLineChart
              title="Speed vs Time"
              subtitle="Time-domain acceleration curve"
              points={speedTimePoints}
              xUnit="s"
              yUnit="km/h"
              stroke="#2563eb"
            />
            <MiniLineChart
              title="Distance vs Time"
              subtitle="Estimated straight-line displacement"
              points={distanceTimePoints}
              xUnit="s"
              yUnit="m"
              stroke="#059669"
            />
            <MiniLineChart
              title="Acceleration vs Speed"
              subtitle="Acceleration taper as drag grows"
              points={accelerationSpeedPoints}
              xUnit="km/h"
              yUnit="m/s²"
              stroke="#7c3aed"
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
