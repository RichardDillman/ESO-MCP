/**
 * CMX Parse Analyzer
 * Analyzes Combat Metrics exports to identify issues and suggest improvements
 * Based on CMX_PARSING.md
 */

export interface CMXParseMetrics {
  // Core Metrics
  totalDamage: number;
  activeTime: number; // Active time, not total time
  dps: number;

  // Rotation Metrics
  abilities: AbilityMetric[];
  dotUptimes: Record<string, number>; // DoT name -> uptime %
  barBalance: {
    frontBar: number; // % time on front bar
    backBar: number; // % time on back bar
  };

  // Weaving Metrics
  lightAttacks: {
    count: number;
    totalDamage: number;
    averageWeaveTime: number; // Goal: close to 0
    missCount: number; // Goal: 0
    ratio: number; // LA per second or LA per skill
  };

  // Buff Metrics
  buffs: BuffMetric[];

  // Stats
  penetration: {
    effective: number; // Damage-weighted, ignoring overcap
    average: number; // Raw average
  };
  criticalChance: number; // As percentage
  criticalDamage: number; // As percentage (total multiplier)
}

export interface AbilityMetric {
  name: string;
  count: number;
  totalDamage: number;
  percentOfTotal: number;
  averageTime: number; // Average time between casts
  weaveTime?: number;
  missCount?: number;
}

export interface BuffMetric {
  name: string;
  uptime: number; // As percentage 0-100
  isPermanent: boolean; // Should be >90% uptime
}

export interface ParseIssue {
  category: 'dps' | 'rotation' | 'weaving' | 'buffs' | 'penetration' | 'crit';
  severity: 'critical' | 'major' | 'minor';
  message: string;
  recommendation: string;
  currentValue?: number | string;
  targetValue?: number | string;
}

/**
 * Analyze CMX parse metrics and identify issues
 * TODO-3 through TODO-8 implementation
 */
export function analyzeCMXParse(metrics: CMXParseMetrics): {
  rating: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  issues: ParseIssue[];
  summary: string;
} {
  const issues: ParseIssue[] = [];

  // TODO-3: DPS Analysis
  if (metrics.dps >= 160000) {
    // Excellent - no issue
  } else if (metrics.dps >= 140000) {
    issues.push({
      category: 'dps',
      severity: 'minor',
      message: 'DPS is good but could be improved',
      recommendation: 'Focus on optimizing rotation and weaving to push above 160k',
      currentValue: Math.round(metrics.dps),
      targetValue: '160k+',
    });
  } else if (metrics.dps >= 130000) {
    issues.push({
      category: 'dps',
      severity: 'major',
      message: 'DPS is below expected range',
      recommendation: 'Check rotation, weaving, and buff uptimes for improvements',
      currentValue: Math.round(metrics.dps),
      targetValue: '140k+',
    });
  } else {
    issues.push({
      category: 'dps',
      severity: 'critical',
      message: 'DPS is significantly below target',
      recommendation: 'Review full rotation, ensure proper weaving, maintain buff uptimes, and check gear/CP allocation',
      currentValue: Math.round(metrics.dps),
      targetValue: '140k+',
    });
  }

  // TODO-4: Rotation Analysis
  // Check if beam/spammable is top damage
  const topAbility = metrics.abilities[0];
  if (topAbility && topAbility.percentOfTotal < 15) {
    issues.push({
      category: 'rotation',
      severity: 'major',
      message: `Top ability (${topAbility.name}) only accounts for ${topAbility.percentOfTotal.toFixed(1)}% of damage`,
      recommendation: 'Your spammable or beam should be your highest damage source. Ensure proper weaving and uptime.',
    });
  }

  // Check DoT uptimes
  for (const [dotName, uptime] of Object.entries(metrics.dotUptimes)) {
    if (uptime < 85) {
      issues.push({
        category: 'rotation',
        severity: uptime < 70 ? 'critical' : 'major',
        message: `${dotName} uptime is low`,
        recommendation: `Maintain ${dotName} uptime above 90%. Consider setting up buff trackers or using DoT timers.`,
        currentValue: `${uptime.toFixed(1)}%`,
        targetValue: '90%+',
      });
    }
  }

  // Check bar balance (should be roughly balanced unless it's a one-bar build)
  if (metrics.barBalance.frontBar > 0 && metrics.barBalance.backBar > 0) {
    const imbalance = Math.abs(metrics.barBalance.frontBar - metrics.barBalance.backBar);
    if (imbalance > 30) {
      issues.push({
        category: 'rotation',
        severity: 'minor',
        message: 'Bar time is imbalanced',
        recommendation: 'Try to balance time between bars. Spending too long on one bar may indicate rotation issues.',
        currentValue: `Front: ${metrics.barBalance.frontBar.toFixed(1)}% / Back: ${metrics.barBalance.backBar.toFixed(1)}%`,
      });
    }
  }

  // TODO-5: Weaving Analysis
  if (metrics.lightAttacks.averageWeaveTime > 0.15) {
    issues.push({
      category: 'weaving',
      severity: metrics.lightAttacks.averageWeaveTime > 0.25 ? 'critical' : 'major',
      message: 'Weave time is too high',
      recommendation: 'Practice light attack weaving to get weave time closer to 0. This significantly impacts DPS.',
      currentValue: `${(metrics.lightAttacks.averageWeaveTime * 1000).toFixed(0)}ms`,
      targetValue: '<100ms',
    });
  }

  if (metrics.lightAttacks.missCount > 5) {
    issues.push({
      category: 'weaving',
      severity: metrics.lightAttacks.missCount > 20 ? 'critical' : 'major',
      message: 'Too many missed light attacks',
      recommendation: 'Ensure you light attack between every skill. Double-barring or double-casting skills wastes damage.',
      currentValue: metrics.lightAttacks.missCount,
      targetValue: '0',
    });
  }

  // TODO-6: Buff Uptime Analysis
  for (const buff of metrics.buffs) {
    if (buff.isPermanent && buff.uptime < 90) {
      issues.push({
        category: 'buffs',
        severity: buff.uptime < 70 ? 'critical' : 'major',
        message: `${buff.name} uptime is low`,
        recommendation: `Maintain permanent buffs above 90% uptime. Consider pre-buffing and refreshing proactively.`,
        currentValue: `${buff.uptime.toFixed(1)}%`,
        targetValue: '90%+',
      });
    }
  }

  // TODO-7: Penetration Analysis
  if (metrics.penetration && metrics.penetration.effective < 18200) {
    const deficit = 18200 - metrics.penetration.effective;
    issues.push({
      category: 'penetration',
      severity: deficit > 3000 ? 'critical' : 'major',
      message: 'Penetration is below cap',
      recommendation: `Increase penetration by ${deficit}. Add Alkosh, Crusher, or penetration CP to reach 18200 cap.`,
      currentValue: metrics.penetration.effective,
      targetValue: '18200',
    });
  } else if (metrics.penetration && metrics.penetration.effective > 20200) {
    const waste = metrics.penetration.effective - 18200;
    issues.push({
      category: 'penetration',
      severity: 'minor',
      message: 'Penetration significantly overcapped',
      recommendation: `You're wasting ${waste} penetration. Consider reallocating CP or gear to other stats.`,
      currentValue: metrics.penetration.effective,
      targetValue: '18200',
    });
  }

  // TODO-8: Crit Analysis
  if (metrics.criticalChance < 60) {
    issues.push({
      category: 'crit',
      severity: 'major',
      message: 'Critical chance is low',
      recommendation: 'Aim for ~67% crit chance with Thief mundus. Adjust gear, CP, or food to increase crit rating.',
      currentValue: `${metrics.criticalChance.toFixed(1)}%`,
      targetValue: '67%',
    });
  }

  if (metrics.criticalDamage < 115) {
    issues.push({
      category: 'crit',
      severity: 'major',
      message: 'Critical damage is low',
      recommendation: 'Increase crit damage to 115-120% range using CP, gear traits, or buffs.',
      currentValue: `${metrics.criticalDamage.toFixed(1)}%`,
      targetValue: '115-120%',
    });
  } else if (metrics.criticalDamage > 125) {
    issues.push({
      category: 'crit',
      severity: 'minor',
      message: 'Critical damage at diminishing returns',
      recommendation: 'Crit damage above 125% has diminishing returns. Consider reallocating to other stats.',
      currentValue: `${metrics.criticalDamage.toFixed(1)}%`,
      targetValue: '115-125%',
    });
  }

  // Determine overall rating
  let rating: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  const criticalIssues = issues.filter((i) => i.severity === 'critical').length;
  const majorIssues = issues.filter((i) => i.severity === 'major').length;

  if (metrics.dps >= 160000 && criticalIssues === 0 && majorIssues === 0) {
    rating = 'excellent';
  } else if (metrics.dps >= 140000 && criticalIssues === 0 && majorIssues <= 2) {
    rating = 'good';
  } else if (metrics.dps >= 130000 || criticalIssues <= 1) {
    rating = 'needs-improvement';
  } else {
    rating = 'poor';
  }

  // Generate summary
  const summary = generateSummary(metrics, issues, rating);

  return { rating, issues, summary };
}

function generateSummary(
  metrics: CMXParseMetrics,
  issues: ParseIssue[],
  rating: string
): string {
  const lines: string[] = [];

  lines.push(`Parse Rating: ${rating.toUpperCase()}`);
  lines.push(`DPS: ${Math.round(metrics.dps).toLocaleString()} (${metrics.activeTime.toFixed(1)}s active)`);
  lines.push('');

  if (issues.length === 0) {
    lines.push('No major issues detected! Keep up the excellent performance.');
  } else {
    const critical = issues.filter((i) => i.severity === 'critical').length;
    const major = issues.filter((i) => i.severity === 'major').length;
    const minor = issues.filter((i) => i.severity === 'minor').length;

    lines.push(`Issues Found: ${critical} critical, ${major} major, ${minor} minor`);
    lines.push('');
    lines.push('Top Priorities:');

    // Show top 5 most severe issues
    const topIssues = issues
      .sort((a, b) => {
        const severityOrder = { critical: 3, major: 2, minor: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 5);

    for (const issue of topIssues) {
      lines.push(`- [${issue.severity.toUpperCase()}] ${issue.message}`);
      lines.push(`  → ${issue.recommendation}`);
    }
  }

  return lines.join('\n');
}

/**
 * Parse simple CMX log format (ability casts with timestamps)
 * Format: "[HH:MM:SS] Ability Name" or "[timestamp] Ability Name"
 * TODO-9 through TODO-12 implementation
 */
export function parseCMXLog(logText: string): {
  events: Array<{ timestamp: number; ability: string; isLightAttack: boolean }>;
  gaps: Array<{ start: number; end: number; duration: number }>;
  analysis: {
    totalGaps: number;
    largestGap: number;
    averageGapSize: number;
  };
} {
  const lines = logText.split('\n').filter((l) => l.trim());
  const events: Array<{ timestamp: number; ability: string; isLightAttack: boolean }> = [];
  const gaps: Array<{ start: number; end: number; duration: number }> = [];

  let lastTimestamp = 0;

  for (const line of lines) {
    // Match format: [HH:MM:SS] Ability Name or [seconds] Ability Name
    const matchTime = line.match(/\[(\d+):(\d+):(\d+(?:\.\d+)?)\]\s+(.+)/);
    const matchSeconds = line.match(/\[(\d+(?:\.\d+)?)\]\s+(.+)/);

    let timestamp: number;
    let ability: string;

    if (matchTime) {
      const [, hours, minutes, seconds, abilityName] = matchTime;
      timestamp = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
      ability = abilityName;
    } else if (matchSeconds) {
      const [, seconds, abilityName] = matchSeconds;
      timestamp = parseFloat(seconds);
      ability = abilityName;
    } else {
      continue; // Skip lines that don't match format
    }

    const isLightAttack = ability.toLowerCase().includes('light attack') ||
      ability.toLowerCase().includes('la') ||
      ability === 'Light Attack';

    events.push({ timestamp, ability, isLightAttack });

    // TODO-10: Detect gaps >1.0s
    if (lastTimestamp > 0) {
      const gap = timestamp - lastTimestamp;
      if (gap > 1.0) {
        gaps.push({
          start: lastTimestamp,
          end: timestamp,
          duration: gap,
        });
      }
    }

    lastTimestamp = timestamp;
  }

  // Calculate gap statistics
  const totalGaps = gaps.length;
  const largestGap = gaps.length > 0 ? Math.max(...gaps.map((g) => g.duration)) : 0;
  const averageGapSize = gaps.length > 0
    ? gaps.reduce((sum, g) => sum + g.duration, 0) / gaps.length
    : 0;

  return {
    events,
    gaps,
    analysis: {
      totalGaps,
      largestGap,
      averageGapSize,
    },
  };
}

/**
 * Validate light attack weaving between skills
 * TODO-11 implementation
 */
export function validateWeaving(events: Array<{ timestamp: number; ability: string; isLightAttack: boolean }>): {
  missedWeaves: number;
  doubleWeaves: number;
  goodWeaves: number;
  weaveEfficiency: number; // Percentage
} {
  let missedWeaves = 0;
  let doubleWeaves = 0;
  let goodWeaves = 0;

  for (let i = 0; i < events.length - 1; i++) {
    const current = events[i];
    const next = events[i + 1];

    // Check for proper weaving pattern
    if (!current.isLightAttack && !next.isLightAttack) {
      // Two skills in a row - missed light attack
      missedWeaves++;
    } else if (current.isLightAttack && next.isLightAttack) {
      // Two light attacks in a row - double weave (mistake)
      doubleWeaves++;
    } else if (current.isLightAttack && !next.isLightAttack) {
      // Light attack followed by skill - good weave
      goodWeaves++;
    }
  }

  const totalActions = events.length - 1;
  const weaveEfficiency = totalActions > 0 ? (goodWeaves / totalActions) * 100 : 0;

  return {
    missedWeaves,
    doubleWeaves,
    goodWeaves,
    weaveEfficiency,
  };
}
