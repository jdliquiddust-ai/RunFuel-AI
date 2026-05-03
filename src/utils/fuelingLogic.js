export const PACE_PER_MILE = { easy: 12, moderate: 10, high: 8 }; // min/mile

const GU_FLAVORS = [
  'Salted Caramel',
  'Chocolate Outrage',
  'Vanilla Bean',
  'Strawberry Banana',
  'Tri-Berry',
  'Peanut Butter',
  'Mandarin Orange',
];

export function generateFuelingPlan(distanceMiles, intensity) {
  const pacePerMile = PACE_PER_MILE[intensity];
  const totalMinutes = distanceMiles * pacePerMile;
  const milestones = [];
  let guCount = 0;

  // GU Energy Gels: every 45 min (every 30 min for sub-10mi easy runs)
  const guInterval = distanceMiles < 10 && intensity === 'easy' ? 30 : 45;

  for (let t = guInterval; t <= totalMinutes - 8; t += guInterval) {
    milestones.push({
      id: `gu-${t}`,
      timeMin: t,
      mile: round1(t / pacePerMile),
      type: 'gu',
      product: 'GU Energy Gel',
      flavor: GU_FLAVORS[guCount % GU_FLAVORS.length],
      action: `1x GU Energy Gel (${GU_FLAVORS[guCount % GU_FLAVORS.length]}) + 6 oz water`,
      icon: '⚡',
      label: 'GU GEL',
      colorHex: '#FF4F00',
      bgClass: 'bg-orange-500',
      priority: 'critical',
      hasSalt: false,
    });
    guCount++;
  }

  // SaltStick Caps: every 60 min, merge with nearest GU if within 8 min
  if (distanceMiles >= 5) {
    for (let t = 60; t <= totalMinutes - 8; t += 60) {
      const nearby = milestones.find(m => m.type === 'gu' && Math.abs(m.timeMin - t) <= 8);
      if (nearby) {
        nearby.action += ' + 2x SaltStick Caps';
        nearby.hasSalt = true;
        nearby.product = 'GU Gel + SaltStick';
        nearby.label = 'GU + SALT';
      } else {
        milestones.push({
          id: `salt-${t}`,
          timeMin: t,
          mile: round1(t / pacePerMile),
          type: 'salt',
          product: 'SaltStick Caps',
          action: '2x SaltStick Caps + 4 oz water',
          icon: '💊',
          label: 'SALTSTICK',
          colorHex: '#3B82F6',
          bgClass: 'bg-blue-500',
          priority: 'high',
        });
      }
    }
  }

  // Hydration: every 20 min, skip if another milestone within 6 min
  for (let t = 20; t <= totalMinutes - 5; t += 20) {
    const hasOther = milestones.some(m => Math.abs(m.timeMin - t) <= 6);
    if (!hasOther) {
      milestones.push({
        id: `hydrate-${t}`,
        timeMin: t,
        mile: round1(t / pacePerMile),
        type: 'hydration',
        product: 'Water',
        action: '4–6 oz water (small sips)',
        icon: '💧',
        label: 'HYDRATE',
        colorHex: '#0EA5E9',
        bgClass: 'bg-sky-400',
        priority: 'medium',
      });
    }
  }

  return milestones.sort((a, b) => a.timeMin - b.timeMin);
}

export function getAlertSchedule(runDateTime, distanceMiles, intensity) {
  const runTime = new Date(runDateTime);
  const pacePerMile = PACE_PER_MILE[intensity];
  const totalMinutes = distanceMiles * pacePerMile;
  const runEndTime = new Date(runTime.getTime() + totalMinutes * 60_000);

  return [
    {
      id: 'carb-load',
      phase: 'pre',
      offsetHours: -12,
      label: 'Night-Before Carb Load',
      icon: '🍝',
      time: new Date(runTime.getTime() - 12 * 3_600_000),
      color: '#FF4F00',
      message:
        'Load up on complex carbs tonight — pasta, rice, or sweet potatoes. Target 500–700 g carbs. Avoid high-fat, high-fiber foods. Drink 32–48 oz water throughout the day.',
      tips: ['Pasta with marinara sauce', 'White rice + grilled chicken', 'Sweet potato + eggs'],
    },
    {
      id: 'pre-hydration',
      phase: 'pre',
      offsetHours: -2,
      label: 'Pre-Run Hydration',
      icon: '💧',
      time: new Date(runTime.getTime() - 2 * 3_600_000),
      color: '#0EA5E9',
      message:
        'Drink 16–20 oz water now. Eat a light 200–300 cal meal. Pre-load electrolytes with 2x SaltStick Caps.',
      tips: ['Banana + toast + honey', '½ bagel + peanut butter', 'Oatmeal + maple syrup'],
    },
    {
      id: 'pre-gel',
      phase: 'pre',
      offsetHours: -0.25,
      label: '15-Minute Pre-Run Gel',
      icon: '⚡',
      time: new Date(runTime.getTime() - 15 * 60_000),
      color: '#FF4F00',
      message:
        'Take 1x GU Energy Gel (Salted Caramel) with 6 oz water. Glycogen stores are now fully topped. Do 5-min dynamic warmup.',
      tips: ['Salted Caramel = optimal pre-run flavor', 'High-cadence leg swings + hip circles'],
    },
    {
      id: 'post-recovery',
      phase: 'post',
      offsetHours: 0.5,
      label: 'Post-Run Recovery Window',
      icon: '🏆',
      time: new Date(runEndTime.getTime() + 30 * 60_000),
      color: '#22C55E',
      message: `30-MINUTE ANABOLIC WINDOW! Consume 20–30 g protein + 50–75 g fast carbs NOW. This window closes fast — don't miss it.`,
      tips: [
        'Chocolate milk (perfect 3:1 carb:protein ratio)',
        'Greek yogurt + banana + honey',
        'Whey shake + white rice',
        '4 eggs + white toast + jam',
      ],
    },
  ];
}

export function getActiveAlerts(scheduledRun) {
  if (!scheduledRun) return [];
  const now = Date.now();
  const schedule = getAlertSchedule(
    scheduledRun.dateTime,
    scheduledRun.distance,
    scheduledRun.intensity
  );
  return schedule.filter(a => {
    const diff = (now - a.time.getTime()) / 60_000;
    return diff >= 0 && diff <= 90;
  });
}

export function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = n => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function getCurrentMile(elapsedSeconds, pacePerMile) {
  return elapsedSeconds / 60 / pacePerMile;
}

export function getNextMilestone(milestones, elapsedSeconds) {
  const elapsedMin = elapsedSeconds / 60;
  return milestones.find(m => m.timeMin > elapsedMin) ?? null;
}

export function getTriggeredMilestone(milestones, elapsedSeconds) {
  const elapsedMin = elapsedSeconds / 60;
  // Trigger window: within 1 second of the milestone
  return milestones.find(
    m => elapsedMin >= m.timeMin && elapsedMin < m.timeMin + (1 / 60)
  ) ?? null;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
