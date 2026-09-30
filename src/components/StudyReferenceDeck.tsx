import React, { useState } from 'react';
import { Calculator, Flame, ShieldAlert, Recycle, ArrowRight } from 'lucide-react';
import { ALL_HSE_QUESTIONS, HSEQuestion } from '../data/questions';

interface StudyReferenceDeckProps {
  onStartTopicQuiz: (questions: HSEQuestion[], title: string) => void;
}

export const StudyReferenceDeck: React.FC<StudyReferenceDeckProps> = ({ onStartTopicQuiz }) => {
  // Interactive Man-Hour & Journey Speed Sandbox State (modeled on PDF Q34, Q57, Q63, Q72)
  const [calcPreset, setCalcPreset] = useState<'q57' | 'q63' | 'q72' | 'q34'>('q57');
  const [workersGroup1, setWorkersGroup1] = useState(14);
  const [hoursPerDay1, setHoursPerDay1] = useState(10);
  const [daysWorked1, setDaysWorked1] = useState(6);

  const [workersGroup2, setWorkersGroup2] = useState(0);
  const [hoursPerDay2, setHoursPerDay2] = useState(8);
  const [daysWorked2, setDaysWorked2] = useState(3);

  // Journey Speed Sandbox (PDF Q34)
  const [distanceKm, setDistanceKm] = useState(210);
  const [tripHours, setTripHours] = useState(2.5);
  const [speedLimit, setSpeedLimit] = useState(65);

  const applyPreset = (preset: 'q57' | 'q63' | 'q72') => {
    setCalcPreset(preset);
    if (preset === 'q57') {
      // Q57 / Q84: 14 workers, 6 days, 10 hrs/day = 840 man-hours
      setWorkersGroup1(14);
      setHoursPerDay1(10);
      setDaysWorked1(6);
      setWorkersGroup2(0);
    } else if (preset === 'q63') {
      // Q63 / Q83: 45 workers, 6 hrs/day, on day 9 = 2430 hours
      setWorkersGroup1(45);
      setHoursPerDay1(6);
      setDaysWorked1(9);
      setWorkersGroup2(0);
    } else if (preset === 'q72') {
      // Q72 / Q110: 10 workers * 8h * 5d + 4 workers * 8h * 3d = 496 man-hours
      setWorkersGroup1(10);
      setHoursPerDay1(8);
      setDaysWorked1(5);
      setWorkersGroup2(4);
      setHoursPerDay2(8);
      setDaysWorked2(3);
    }
  };

  const group1Total = workersGroup1 * hoursPerDay1 * daysWorked1;
  const group2Total = workersGroup2 * hoursPerDay2 * daysWorked2;
  const combinedManHours = group1Total + group2Total;

  const requiredSpeed = tripHours > 0 ? Math.round((distanceKm / tripHours) * 10) / 10 : 0;
  const isOverSpeedLimit = requiredSpeed > speedLimit;

  const startMathQuiz = () => {
    const mathIds = [34, 57, 63, 72, 83, 84, 110];
    const qs = ALL_HSE_QUESTIONS.filter((q) => mathIds.includes(q.id));
    onStartTopicQuiz(qs, 'HSE Man-Hour & Journey Math Drill (7 Qs)');
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="text-xs text-slate-500 mb-1.5">
          <span>Interactive Exam Formula & Concept Sandbox</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>100% Grounded in Uploaded PDF</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          HSE Exam Study Reference & Interactive Calculators
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Master the exact mathematical calculations, fire classifications, hierarchy of controls, and ISO 14001 frameworks tested across Questions 1–120.
        </p>
      </div>

      {/* SECTION 1: Interactive Man-Hour & Journey Management Calculator */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100">
          <div>
            <div className="text-xs text-slate-500 mb-1">
              Covers PDF Questions #34, #57, #63, #72, #83, #84, #110
            </div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-sky-600" />
              <span>01. Interactive Man-Hour & Journey Speed Simulator</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={startMathQuiz}
            className="px-4 py-2 bg-sky-600 text-white text-xs font-semibold rounded-lg hover:bg-sky-700 flex items-center gap-1.5 self-start cursor-pointer"
          >
            <span>Practice All 7 Calculation Questions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Man-Hour Calculator */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Man-Hour Formula Explorer</h3>
              <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => applyPreset('q57')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                    calcPreset === 'q57' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Q#57 / #84
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('q63')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                    calcPreset === 'q63' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Q#63 / #83
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('q72')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                    calcPreset === 'q72' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Q#72 / #110
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-3">
                <div className="font-semibold text-slate-800">Primary Workforce Group</div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">Workers Count:</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">{workersGroup1} workers</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={60}
                    value={workersGroup1}
                    onChange={(e) => setWorkersGroup1(Number(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">Hours Worked per Day:</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">{hoursPerDay1} hrs/day</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={16}
                    value={hoursPerDay1}
                    onChange={(e) => setHoursPerDay1(Number(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">Number of Days Counted:</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">{daysWorked1} days</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={daysWorked1}
                    onChange={(e) => setDaysWorked1(Number(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>
              </div>

              {workersGroup2 > 0 && (
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                  <div className="font-semibold text-slate-800">
                    Second Workforce Group (Split Schedule like Q#72)
                  </div>
                  <div className="flex justify-between text-slate-700 font-mono">
                    <span>
                      {workersGroup2} workers × {hoursPerDay2} hrs/day × {daysWorked2} days
                    </span>
                    <span className="font-bold">= {group2Total} hours</span>
                  </div>
                </div>
              )}

              <div className="p-4 bg-slate-900 text-white rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-xs">Formula: Workers × Hours/Day × Days</div>
                  <div className="font-mono text-xs text-sky-300 mt-0.5">
                    {workersGroup2 > 0
                      ? `(${workersGroup1}×${hoursPerDay1}×${daysWorked1}) + (${workersGroup2}×${hoursPerDay2}×${daysWorked2})`
                      : `${workersGroup1} × ${hoursPerDay1} × ${daysWorked1}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                    {combinedManHours.toLocaleString()} hours
                  </div>
                  <div className="text-[11px] text-slate-300">Note: Unit is always "hours", never "days"!</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Journey Management Speed Calculator (PDF Q34) */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Journey Management Speed Analysis (PDF Q#34)
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setDistanceKm(210);
                    setTripHours(2.5);
                    setSpeedLimit(65);
                  }}
                  className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                >
                  Reset to Q#34 Values
                </button>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                In Question 34, driver Adebayo must travel <strong>210 km</strong> starting at{' '}
                <strong>1500 hrs</strong> and arriving at <strong>1730 hrs</strong> (2.5 hours) with a company speed
                limit of <strong>65 km/hr</strong>.
              </p>

              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-3 text-xs mb-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">Delivery Distance (km):</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">{distanceKm} km</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={400}
                    step={5}
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">Available Time Window (1500hrs to 1730hrs = 2.5 hrs):</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">{tripHours} hours</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    step={0.5}
                    value={tripHours}
                    onChange={(e) => setTripHours(Number(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">Company Maximum Speed Policy:</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">{speedLimit} km/hr</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={100}
                    step={5}
                    value={speedLimit}
                    onChange={(e) => setSpeedLimit(Number(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                isOverSpeedLimit
                  ? 'bg-red-50 border-red-300 text-red-950'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold">Required Speed = {distanceKm} km ÷ {tripHours} hrs</div>
                  <div className="text-xs mt-1 font-medium">
                    {isOverSpeedLimit
                      ? `▲ VIOLATION: ${requiredSpeed} km/hr is MORE than the ${speedLimit} km/hr allowed!`
                      : `● COMPLIANT: ${requiredSpeed} km/hr is within the ${speedLimit} km/hr limit.`}
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums">
                  {requiredSpeed} km/hr
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Key Distinctions & High-Yield Exam Traps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Hierarchy of Controls (Q65 vs Q78) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 mb-1">PDF Q#65, #78, #113</div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-sky-600" />
              <span>02. Hierarchy of Hazard Controls</span>
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Watch the exact options offered in the question! Ranked from most effective (1) to least effective (5):
            </p>
            <ol className="space-y-2 text-xs mb-4">
              <li className="p-2 bg-emerald-50 border-l-2 border-emerald-600 font-semibold text-slate-900">
                1. Elimination (Physically remove the hazard)
              </li>
              <li className="p-2 bg-emerald-50/70 border-l-2 border-emerald-500 font-semibold text-slate-900">
                2. Substitution (Winner in Q#78: "Control by substitution")
              </li>
              <li className="p-2 bg-sky-50 border-l-2 border-sky-500 font-semibold text-slate-900">
                3. Engineering Controls (Winner in Q#65 & #113 where Substitution is absent)
              </li>
              <li className="p-2 bg-amber-50 border-l-2 border-amber-500 text-slate-800">
                4. Administrative Controls (Procedures, training, shift rotation)
              </li>
              <li className="p-2 bg-slate-100 border-l-2 border-slate-400 text-slate-700">
                5. Personal Protective Equipment (PPE — Last line of defense)
              </li>
            </ol>
          </div>
        </div>

        {/* Card 2: Fire Safety Mastery (Q1, Q7, Q10, Q23, Q28, Q30, Q31, Q35, Q37, Q55) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 mb-1">PDF Q#1, #7, #10, #23, #28, #30, #31, #35, #55</div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>03. Fire Safety Quick Key</span>
            </h3>
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="pb-2 border-b border-slate-100">
                <strong className="text-slate-900">First action in case of fire (Q#55, #82):</strong> Raise the alarm to inform others.
              </div>
              <div className="pb-2 border-b border-slate-100">
                <strong className="text-slate-900">PASS Acronym (Q#1):</strong> Pull the pin → Aim the nozzle → Squeeze the handle → Sweep from side to side.
              </div>
              <div className="pb-2 border-b border-slate-100">
                <strong className="text-slate-900">Fire Tetrahedron (Q#31):</strong> Fuel + Heat + Oxygen + Chemical chain reaction.
              </div>
              <div className="pb-2 border-b border-slate-100">
                <strong className="text-slate-900">Class A, B & C Extinguisher (Q#7):</strong> Dry chemical powder.
              </div>
              <div className="pb-2 border-b border-slate-100">
                <strong className="text-slate-900">Class D Metal Fires (Q#10, #23):</strong> Combustible metals; dry sand removes oxygen and absorbs heat.
              </div>
              <div>
                <strong className="text-slate-900">Starvation (Q#35):</strong> Shutting off fuel supply valves. <strong className="text-slate-900">Critical Early Phase (Q#28):</strong> Incipient phase.
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Environmental & Waste Management (Q2, Q6, Q18, Q21, Q22, Q27, Q40, Q99) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 mb-1">PDF Q#2, #6, #18, #21, #22, #27, #40, #99</div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Recycle className="w-4 h-4 text-emerald-600" />
              <span>04. Environmental & Waste Key</span>
            </h3>
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="pb-2 border-b border-slate-100">
                <strong className="text-slate-900">Environmental Aspect (Q#27, #39, #52, #92):</strong> An element of activities, products, or services that can interact with the environment.
              </div>
              <div className="pb-2 border-b border-slate-100">
                <strong className="text-slate-900">Environmental Pollution (Q#99):</strong> Release of any substance in quantities that cause harm to the environment.
              </div>
              <div className="pb-2 border-b border-slate-100">
                <strong className="text-slate-900">Waste Hierarchy Top Choice (Q#18):</strong> Source reduction (most preferred).
              </div>
              <div className="pb-2 border-b border-slate-100">
                <strong className="text-slate-900">Systematic Stages of Waste Mgmt (Q#2):</strong> Six (6) stages.
              </div>
              <div className="pb-2 border-b border-slate-100">
                <strong className="text-slate-900">Waste Inventory (Q#40):</strong> Taking a list of waste based on source, type, and quantity.
              </div>
              <div>
                <strong className="text-slate-900">ISO 14001:2015 EMS (Q#6, #22):</strong> Underpinned by Plan–Do–Check–Act (PDCA) for continual improvement in environmental performance.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
