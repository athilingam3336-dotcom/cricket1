import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions
} from 'react-native';

export interface ShotDelivery {
  id?: string;
  strikerId: string;
  bowlerId?: string;
  runsBatter: number;
  runsExtras?: number;
  totalRuns?: number;
  extraType?: string;
  wicket?: boolean;
  fieldingPosition?: string;
  shotAngle?: number;
  shotDistance?: number;
  shotZone?: string;
  overNumber?: number;
  ballNumber?: number;
  commentary?: string;
}

export interface BatterProfile {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours?: number;
  sixes?: number;
  strikeRate?: number | string;
  isOut?: boolean;
  dismissal?: string;
}

interface WagonWheelProps {
  deliveries: ShotDelivery[];
  batters: BatterProfile[];
  selectedBatterId?: string;
  onSelectBatter?: (batterId: string) => void;
  title?: string;
  subtitle?: string;
}

// 8 Cricket Field Sectors Definition
const SECTORS = [
  { key: 'cover', name: 'Cover / Extra Cover', startAngle: 292.5, endAngle: 337.5, side: 'OFF', color: '#10b981' },
  { key: 'long_off', name: 'Mid-Off / Long Off', startAngle: 337.5, endAngle: 22.5, side: 'OFF', color: '#06b6d4' },
  { key: 'long_on', name: 'Mid-On / Long On', startAngle: 22.5, endAngle: 67.5, side: 'LEG', color: '#3b82f6' },
  { key: 'midwicket', name: 'Midwicket / Cow Corner', startAngle: 67.5, endAngle: 112.5, side: 'LEG', color: '#8b5cf6' },
  { key: 'square_leg', name: 'Square Leg', startAngle: 112.5, endAngle: 157.5, side: 'LEG', color: '#f59e0b' },
  { key: 'fine_leg', name: 'Fine Leg', startAngle: 157.5, endAngle: 202.5, side: 'LEG', color: '#ef4444' },
  { key: 'third_man', name: 'Third Man / Slips', startAngle: 202.5, endAngle: 247.5, side: 'OFF', color: '#ec4899' },
  { key: 'point', name: 'Point / Backward Point', startAngle: 247.5, endAngle: 292.5, side: 'OFF', color: '#14b8a6' }
];

export default function WagonWheel({
  deliveries = [],
  batters = [],
  selectedBatterId,
  onSelectBatter,
  title = '🏏 Batsman Wagon Wheel & Shot Analytics',
  subtitle = 'Interactive Shot Trajectories & Playing Area Breakdown'
}: WagonWheelProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  // Active batter selection
  const defaultBatterId = selectedBatterId || (batters[0]?.id ?? '');
  const [activeBatterId, setActiveBatterId] = useState<string>(defaultBatterId);

  // Sync if prop changes
  React.useEffect(() => {
    if (selectedBatterId) {
      setActiveBatterId(selectedBatterId);
    } else if (batters.length > 0 && !activeBatterId) {
      setActiveBatterId(batters[0].id);
    }
  }, [selectedBatterId, batters]);

  // Selected Run filter: 'ALL', 1, 2, 3, 4, 6, 0
  const [runFilter, setRunFilter] = useState<string>('ALL');
  // Selected Sector highlight filter
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  // Selected active shot hover/touch
  const [activeShot, setActiveShot] = useState<ShotDelivery | null>(null);

  const currentBatter = useMemo(() => {
    return batters.find(b => b.id === activeBatterId) || batters[0];
  }, [batters, activeBatterId]);

  // Filter deliveries belonging to this batter
  const batterDeliveries = useMemo(() => {
    if (!currentBatter) return [];
    const id = currentBatter.id;
    const name = currentBatter.name?.toLowerCase() || '';

    // If deliveries are provided with strikerId
    const matched = deliveries.filter(d => {
      if (d.strikerId === id) return true;
      // If mock id format like 'P301' or '1'
      if (id.includes(d.strikerId) || d.strikerId.includes(id)) return true;
      return false;
    });

    if (matched.length > 0) return matched;

    // Synthetic fallback generator for demonstration if real deliveries list is empty
    return generateSyntheticShots(currentBatter);
  }, [deliveries, currentBatter]);

  // Calculate sector and playing area percentages
  const stats = useMemo(() => {
    let totalRuns = 0;
    let offRuns = 0;
    let legRuns = 0;
    let offBalls = 0;
    let legBalls = 0;

    const sectorMap: Record<string, { runs: number; balls: number; fours: number; sixes: number }> = {};
    SECTORS.forEach(s => {
      sectorMap[s.key] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
    });

    batterDeliveries.forEach(d => {
      const runs = Number(d.runsBatter) || 0;
      totalRuns += runs;
      const angle = (typeof d.shotAngle === 'number' ? d.shotAngle : 315) % 360;

      // Off vs Leg
      if (angle >= 180 && angle <= 360) {
        offRuns += runs;
        offBalls++;
      } else {
        legRuns += runs;
        legBalls++;
      }

      // Find matching sector
      let matchedSectorKey = 'cover';
      for (const s of SECTORS) {
        if (s.startAngle > s.endAngle) {
          // Crosses 0/360 boundary (e.g. 337.5 to 22.5)
          if (angle >= s.startAngle || angle < s.endAngle) {
            matchedSectorKey = s.key;
            break;
          }
        } else {
          if (angle >= s.startAngle && angle < s.endAngle) {
            matchedSectorKey = s.key;
            break;
          }
        }
      }

      if (sectorMap[matchedSectorKey]) {
        sectorMap[matchedSectorKey].runs += runs;
        sectorMap[matchedSectorKey].balls += 1;
        if (runs === 4) sectorMap[matchedSectorKey].fours += 1;
        if (runs === 6) sectorMap[matchedSectorKey].sixes += 1;
      }
    });

    const offPct = totalRuns > 0 ? Math.round((offRuns / totalRuns) * 100) : 50;
    const legPct = totalRuns > 0 ? 100 - offPct : 50;

    return {
      totalRuns,
      totalBalls: batterDeliveries.length,
      offRuns,
      legRuns,
      offPct,
      legPct,
      offBalls,
      legBalls,
      sectors: SECTORS.map(s => {
        const data = sectorMap[s.key] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
        const pct = totalRuns > 0 ? Math.round((data.runs / totalRuns) * 100) : 0;
        return {
          ...s,
          ...data,
          pct
        };
      })
    };
  }, [batterDeliveries]);

  // Filtered deliveries based on user selection
  const displayedDeliveries = useMemo(() => {
    return batterDeliveries.filter(d => {
      const runs = Number(d.runsBatter) || 0;
      if (runFilter !== 'ALL') {
        if (runFilter === 'DOT' && runs !== 0) return false;
        if (runFilter === '1' && runs !== 1) return false;
        if (runFilter === '2' && runs !== 2) return false;
        if (runFilter === '3' && runs !== 3) return false;
        if (runFilter === '4' && runs !== 4) return false;
        if (runFilter === '6' && runs !== 6) return false;
      }

      if (sectorFilter) {
        const s = SECTORS.find(sec => sec.key === sectorFilter);
        if (s) {
          const angle = (typeof d.shotAngle === 'number' ? d.shotAngle : 315) % 360;
          if (s.startAngle > s.endAngle) {
            if (!(angle >= s.startAngle || angle < s.endAngle)) return false;
          } else {
            if (!(angle >= s.startAngle && angle < s.endAngle)) return false;
          }
        }
      }

      return true;
    });
  }, [batterDeliveries, runFilter, sectorFilter]);

  // Run counts for badges
  const runCounts = useMemo(() => {
    const counts = { total: 0, dots: 0, ones: 0, twos: 0, threes: 0, fours: 0, sixes: 0 };
    batterDeliveries.forEach(d => {
      counts.total++;
      const r = Number(d.runsBatter) || 0;
      if (r === 0) counts.dots++;
      else if (r === 1) counts.ones++;
      else if (r === 2) counts.twos++;
      else if (r === 3) counts.threes++;
      else if (r === 4) counts.fours++;
      else if (r === 6) counts.sixes++;
    });
    return counts;
  }, [batterDeliveries]);

  // Responsive Geometry dimensions: Fixed internal viewBox with responsive render sizing
  const baseSize = 400;
  const cx = baseSize / 2;
  const cy = baseSize / 2;
  const radius = baseSize / 2 - 20;
  const innerCircleR = radius * 0.44; // 30-yard circle
  const pitchW = 18;
  const pitchH = 46;
  const displaySize = isDesktop ? 420 : Math.min(Math.max(width - 56, 260), 380);

  // Function to compute (x, y) coordinates for a shot
  const getCoordinates = (angleDeg: number, distancePct: number) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const clampedDist = Math.max(10, Math.min(distancePct, 115));
    const distPx = (radius * clampedDist) / 100;
    const x = cx + distPx * Math.sin(angleRad);
    const y = cy - distPx * Math.cos(angleRad);
    return { x, y };
  };

  const getShotColor = (runs: number) => {
    switch (runs) {
      case 6: return '#ec4899'; // Hot Magenta
      case 4: return '#10b981'; // Vivid Green
      case 3: return '#f59e0b'; // Amber
      case 2: return '#3b82f6'; // Bright Blue
      case 1: return '#06b6d4'; // Cyan
      default: return '#94a3b8'; // Grey dot
    }
  };

  const handleBatterChange = (id: string) => {
    setActiveBatterId(id);
    setActiveShot(null);
    setSectorFilter(null);
    if (onSelectBatter) onSelectBatter(id);
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
        {currentBatter && (
          <View style={styles.batterBadge}>
            <Text style={styles.batterBadgeName}>
              {currentBatter.name}
            </Text>
            <Text style={styles.batterBadgeStats}>
              {currentBatter.runs} runs ({currentBatter.balls} balls) • SR {currentBatter.strikeRate || ((currentBatter.runs / (currentBatter.balls || 1)) * 100).toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Batsman Selector Chips */}
      {batters.length > 1 && (
        <View style={styles.batterSelectorWrapper}>
          <Text style={styles.selectorLabel}>SELECT BATSMAN:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.batterChipsScroll}>
            {batters.map(b => {
              const isActive = b.id === activeBatterId;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.batterChip, isActive && styles.batterChipActive]}
                  onPress={() => handleBatterChange(b.id)}
                >
                  <Text style={[styles.batterChipName, isActive && styles.batterChipTextActive]}>
                    {b.name}
                  </Text>
                  <Text style={[styles.batterChipRuns, isActive && styles.batterChipRunsActive]}>
                    {b.runs} ({b.balls})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Run Filter Pills */}
      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>SHOTS FILTER:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterPill, runFilter === 'ALL' && styles.filterPillActive]}
            onPress={() => setRunFilter('ALL')}
          >
            <Text style={[styles.filterPillText, runFilter === 'ALL' && styles.filterPillTextActive]}>
              All ({runCounts.total})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, runFilter === '6' && styles.filterPillActiveSix]}
            onPress={() => setRunFilter(runFilter === '6' ? 'ALL' : '6')}
          >
            <View style={[styles.dotMarker, { backgroundColor: '#ec4899' }]} />
            <Text style={[styles.filterPillText, runFilter === '6' && styles.filterPillTextActive]}>
              6s ({runCounts.sixes})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, runFilter === '4' && styles.filterPillActiveFour]}
            onPress={() => setRunFilter(runFilter === '4' ? 'ALL' : '4')}
          >
            <View style={[styles.dotMarker, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.filterPillText, runFilter === '4' && styles.filterPillTextActive]}>
              4s ({runCounts.fours})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, runFilter === '3' && styles.filterPillActiveThree]}
            onPress={() => setRunFilter(runFilter === '3' ? 'ALL' : '3')}
          >
            <View style={[styles.dotMarker, { backgroundColor: '#f59e0b' }]} />
            <Text style={[styles.filterPillText, runFilter === '3' && styles.filterPillTextActive]}>
              3s ({runCounts.threes})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, runFilter === '2' && styles.filterPillActiveTwo]}
            onPress={() => setRunFilter(runFilter === '2' ? 'ALL' : '2')}
          >
            <View style={[styles.dotMarker, { backgroundColor: '#3b82f6' }]} />
            <Text style={[styles.filterPillText, runFilter === '2' && styles.filterPillTextActive]}>
              2s ({runCounts.twos})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, runFilter === '1' && styles.filterPillActiveOne]}
            onPress={() => setRunFilter(runFilter === '1' ? 'ALL' : '1')}
          >
            <View style={[styles.dotMarker, { backgroundColor: '#06b6d4' }]} />
            <Text style={[styles.filterPillText, runFilter === '1' && styles.filterPillTextActive]}>
              1s ({runCounts.ones})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, runFilter === 'DOT' && styles.filterPillActiveDot]}
            onPress={() => setRunFilter(runFilter === 'DOT' ? 'ALL' : 'DOT')}
          >
            <View style={[styles.dotMarker, { backgroundColor: '#94a3b8' }]} />
            <Text style={[styles.filterPillText, runFilter === 'DOT' && styles.filterPillTextActive]}>
              Dots ({runCounts.dots})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content: Split into Wagon Wheel on Left + Area Percentage on Right on Desktop */}
      <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
        {/* LEFT COLUMN: THE WAGON WHEEL CANVAS */}
        <View style={styles.wheelWrapper}>
          <View style={[styles.groundContainer, { width: displaySize, height: displaySize }]}>
            {/* Standard SVG Rendering (Works flawlessly on React Native Web & Native) */}
            <svg
              width={displaySize}
              height={displaySize}
              viewBox={`0 0 ${baseSize} ${baseSize}`}
              style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
            >
              <defs>
                {/* Stadium Grass Gradient */}
                <radialGradient id="turfGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0b381e" />
                  <stop offset="70%" stopColor="#062613" />
                  <stop offset="100%" stopColor="#02140a" />
                </radialGradient>
                {/* Pitch Texture */}
                <linearGradient id="pitchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c5a880" />
                  <stop offset="50%" stopColor="#d8b991" />
                  <stop offset="100%" stopColor="#c5a880" />
                </linearGradient>
                {/* Glow Filter for Boundaries */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 1. Main Outfield Circle */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="url(#turfGradient)"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />

              {/* 2. Outer Boundary Rope Border */}
              <circle
                cx={cx}
                cy={cy}
                r={radius + 4}
                fill="none"
                stroke="rgba(245, 158, 11, 0.4)"
                strokeWidth="1.5"
              />

              {/* 3. 8 Sector Divider Lines & Sector Labels */}
              {SECTORS.map(s => {
                const borderCoord = getCoordinates(s.startAngle, 100);
                const labelCoord = getCoordinates((s.startAngle + 22.5) % 360, 84);
                const isSelected = sectorFilter === s.key;

                return (
                  <g key={s.key}>
                    {/* Radial divider */}
                    <line
                      x1={cx}
                      y1={cy}
                      x2={borderCoord.x}
                      y2={borderCoord.y}
                      stroke="rgba(255, 255, 255, 0.12)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    {/* Sector Name Watermark inside field */}
                    <text
                      x={labelCoord.x}
                      y={labelCoord.y}
                      fill={isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.45)'}
                      fontSize={isDesktop ? 9 : 8}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      textAnchor="middle"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {s.name.split(' / ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* 4. 30-Yard Infield Circle */}
              <circle
                cx={cx}
                cy={cy}
                r={innerCircleR}
                fill="none"
                stroke="rgba(255, 255, 255, 0.28)"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />

              {/* 5. Central Cricket Pitch */}
              <rect
                x={cx - pitchW / 2}
                y={cy - pitchH / 2}
                width={pitchW}
                height={pitchH}
                fill="url(#pitchGrad)"
                rx="2"
                stroke="#8d6e63"
                strokeWidth="1"
              />
              {/* Bowling Crease & Stumps */}
              <line x1={cx - pitchW / 2} y1={cy - pitchH / 2 + 5} x2={cx + pitchW / 2} y2={cy - pitchH / 2 + 5} stroke="#ffffff" strokeWidth="1" />
              {/* Batting Crease (Striker) */}
              <line x1={cx - pitchW / 2} y1={cy + pitchH / 2 - 5} x2={cx + pitchW / 2} y2={cy + pitchH / 2 - 5} stroke="#ffffff" strokeWidth="1" />
              {/* Stumps Marker */}
              <circle cx={cx} cy={cy + pitchH / 2 - 3} r="1.5" fill="#e11d48" />

              {/* 6. Wagon Wheel Shot Trajectory Lines */}
              {displayedDeliveries.map((del, idx) => {
                const runs = Number(del.runsBatter) || 0;
                const angle = typeof del.shotAngle === 'number' ? del.shotAngle : 315;
                const dist = typeof del.shotDistance === 'number' ? del.shotDistance : (runs === 6 ? 108 : runs === 4 ? 94 : 45);
                const end = getCoordinates(angle, dist);
                const color = getShotColor(runs);
                const isCurrentActive = activeShot?.id === del.id;

                const strokeWidth = runs === 6 ? 2.5 : runs === 4 ? 2.0 : 1.3;
                const strokeDash = runs === 6 ? '4 2' : runs === 0 ? '2 2' : 'none';

                return (
                  <g
                    key={del.id || `shot-${idx}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveShot(del)}
                  >
                    {/* Glow backdrop on hover */}
                    {isCurrentActive && (
                      <line
                        x1={cx}
                        y1={cy + 8}
                        x2={end.x}
                        y2={end.y}
                        stroke="#ffffff"
                        strokeWidth={strokeWidth + 4}
                        opacity="0.4"
                      />
                    )}
                    {/* The Shot Line */}
                    <line
                      x1={cx}
                      y1={cy + 8}
                      x2={end.x}
                      y2={end.y}
                      stroke={color}
                      strokeWidth={isCurrentActive ? strokeWidth + 1.5 : strokeWidth}
                      strokeDasharray={strokeDash}
                      opacity={isCurrentActive ? 1.0 : 0.85}
                    />
                    {/* Terminal Marker */}
                    <circle
                      cx={end.x}
                      cy={end.y}
                      r={runs === 6 ? 4.5 : runs === 4 ? 3.5 : 2.5}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth={isCurrentActive ? 1.5 : 0.75}
                    />
                  </g>
                );
              })}

              {/* Batter Orientations Label (Off / Leg side indicator) */}
              <text x={cx - radius + 15} y={cy} fill="rgba(56, 189, 248, 0.7)" fontSize="10" fontWeight="bold">
                OFF
              </text>
              <text x={cx + radius - 35} y={cy} fill="rgba(245, 158, 11, 0.7)" fontSize="10" fontWeight="bold">
                LEG
              </text>
            </svg>

            {/* Hovered / Tapped Shot Detail Tooltip Card */}
            {activeShot && (
              <View style={styles.shotTooltip}>
                <View style={styles.tooltipHeader}>
                  <Text style={[styles.tooltipBadge, { backgroundColor: getShotColor(activeShot.runsBatter) }]}>
                    {activeShot.runsBatter} RUNS
                  </Text>
                  <TouchableOpacity onPress={() => setActiveShot(null)} style={styles.tooltipClose}>
                    <Text style={styles.tooltipCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.tooltipPosition}>
                  Direction: {activeShot.fieldingPosition || activeShot.shotZone || 'Field'} ({activeShot.shotAngle}° angle)
                </Text>
                {activeShot.overNumber !== undefined && (
                  <Text style={styles.tooltipBall}>
                    Over {activeShot.overNumber}.{activeShot.ballNumber}
                  </Text>
                )}
                {activeShot.commentary ? (
                  <Text style={styles.tooltipComm} numberOfLines={2}>
                    "{activeShot.commentary}"
                  </Text>
                ) : null}
              </View>
            )}
          </View>

          {/* Quick Clear Filter if active */}
          {sectorFilter && (
            <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setSectorFilter(null)}>
              <Text style={styles.clearFilterText}>
                ✕ Filtered by {SECTORS.find(s => s.key === sectorFilter)?.name} (Tap to reset)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* RIGHT COLUMN: PLAYING AREA PERCENTAGES & 8-SECTOR BREAKDOWN */}
        <View style={styles.analyticsWrapper}>
          {/* 1. OFF-SIDE vs LEG-SIDE PROPORTIONAL BALANCE BAR */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceTitle}>⚖️ Off-Side vs Leg-Side Ratio</Text>
              <Text style={styles.balanceTotalRuns}>{stats.totalRuns} Total Runs</Text>
            </View>

            {/* Duel Split Progress Bar */}
            <View style={styles.duelBarTrack}>
              <View style={[styles.duelBarOff, { width: `${stats.offPct}%` }]}>
                <Text style={styles.duelBarText}>{stats.offPct}% OFF</Text>
              </View>
              <View style={[styles.duelBarLeg, { width: `${stats.legPct}%` }]}>
                <Text style={styles.duelBarText}>{stats.legPct}% LEG</Text>
              </View>
            </View>

            <View style={styles.balanceDetailsRow}>
              <Text style={styles.offDetailText}>
                🔵 Off-Side: <Text style={styles.boldText}>{stats.offRuns} runs</Text> ({stats.offBalls} balls)
              </Text>
              <Text style={styles.legDetailText}>
                🟠 Leg-Side: <Text style={styles.boldText}>{stats.legRuns} runs</Text> ({stats.legBalls} balls)
              </Text>
            </View>
          </View>

          {/* 2. 8-SECTOR PLAYING AREA BREAKDOWN TABLE / CARDS */}
          <View style={styles.sectorTableCard}>
            <View style={styles.sectorCardHeader}>
              <Text style={styles.sectorCardTitle}>📊 Playing Area Percentage By Sector</Text>
              <Text style={styles.sectorCardHint}>Tap any sector to isolate shots</Text>
            </View>

            <View style={styles.sectorGrid}>
              {stats.sectors.map(sec => {
                const isSelected = sectorFilter === sec.key;
                return (
                  <TouchableOpacity
                    key={sec.key}
                    style={[
                      styles.sectorRowItem,
                      isSelected && styles.sectorRowSelected
                    ]}
                    onPress={() => setSectorFilter(isSelected ? null : sec.key)}
                  >
                    <View style={styles.sectorRowTop}>
                      <View style={styles.sectorNameWrapper}>
                        <View style={[styles.sectorColorDot, { backgroundColor: sec.color }]} />
                        <Text style={[styles.sectorNameText, isSelected && styles.sectorNameActive]}>
                          {sec.name}
                        </Text>
                      </View>
                      <View style={styles.sectorValueWrapper}>
                        <Text style={styles.sectorRunsText}>{sec.runs} runs</Text>
                        <Text style={[styles.sectorPctBadge, { color: sec.color }]}>
                          {sec.pct}%
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar for Sector */}
                    <View style={styles.sectorBarTrack}>
                      <View
                        style={[
                          styles.sectorBarFill,
                          { width: `${Math.max(sec.pct, 2)}%`, backgroundColor: sec.color }
                        ]}
                      />
                    </View>

                    <View style={styles.sectorSubRow}>
                      <Text style={styles.sectorSubText}>
                        {sec.balls} balls • {sec.fours} fours • {sec.sixes} sixes
                      </Text>
                      <Text style={styles.sectorSideBadge}>
                        {sec.side}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// Helper: Synthetic mock shot generator for initial display or players without ball-by-ball logs
function generateSyntheticShots(batter: BatterProfile): ShotDelivery[] {
  const shots: ShotDelivery[] = [];
  const runsTotal = batter.runs || 24;
  const ballsTotal = batter.balls || 18;
  const fours = batter.fours || Math.floor(runsTotal / 8);
  const sixes = batter.sixes || (runsTotal > 30 ? 1 : 0);

  // Add sixes
  for (let i = 0; i < sixes; i++) {
    const angle = i % 2 === 0 ? 80 : 330; // Cow Corner or Long Off
    shots.push({
      strikerId: batter.id,
      runsBatter: 6,
      shotAngle: angle,
      shotDistance: 108,
      fieldingPosition: angle === 80 ? 'Midwicket' : 'Mid-Off',
      shotZone: angle === 80 ? 'Midwicket / Cow Corner' : 'Mid-Off / Long Off',
      commentary: 'Massive hit clearing the ropes with ease!'
    });
  }

  // Add fours
  const fourPositions = [
    { angle: 315, pos: 'Cover', zone: 'Cover / Extra Cover' },
    { angle: 270, pos: 'Point', zone: 'Point / Backward Point' },
    { angle: 60, pos: 'Midwicket', zone: 'Midwicket / Cow Corner' },
    { angle: 140, pos: 'Fine Leg', zone: 'Fine Leg' },
    { angle: 220, pos: 'Third Man', zone: 'Third Man / Slips' }
  ];
  for (let i = 0; i < fours; i++) {
    const item = fourPositions[i % fourPositions.length];
    shots.push({
      strikerId: batter.id,
      runsBatter: 4,
      shotAngle: item.angle + (Math.random() - 0.5) * 6,
      shotDistance: 94 + Math.random() * 4,
      fieldingPosition: item.pos,
      shotZone: item.zone,
      commentary: 'Crisp timing, pierces the gap to the fence!'
    });
  }

  // Calculate remaining runs for 1s, 2s, and 3s
  let currentRuns = sixes * 6 + fours * 4;
  let remainingBalls = Math.max(0, ballsTotal - sixes - fours);

  while (currentRuns < runsTotal && remainingBalls > 0) {
    const run = (runsTotal - currentRuns) >= 2 ? 2 : 1;
    currentRuns += run;
    remainingBalls--;
    const angle = Math.floor(Math.random() * 360);
    shots.push({
      strikerId: batter.id,
      runsBatter: run,
      shotAngle: angle,
      shotDistance: run === 2 ? 62 : 44,
      fieldingPosition: 'Infield',
      commentary: `${run} run taken, neat placement.`
    });
  }

  // Remaining balls as dots (0s)
  while (remainingBalls > 0) {
    remainingBalls--;
    const angle = Math.floor(Math.random() * 360);
    shots.push({
      strikerId: batter.id,
      runsBatter: 0,
      shotAngle: angle,
      shotDistance: 25 + Math.random() * 10,
      fieldingPosition: 'Point',
      commentary: 'Defended gently into the inner circle.'
    });
  }

  return shots;
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 12,
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2
  },
  batterBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#0284c7',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  batterBadgeName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#38bdf8'
  },
  batterBadgeStats: {
    fontSize: 11,
    color: '#bae6fd',
    marginTop: 2
  },
  batterSelectorWrapper: {
    marginBottom: 14
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 6,
    letterSpacing: 0.5
  },
  batterChipsScroll: {
    gap: 8,
    paddingVertical: 4
  },
  batterChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  batterChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8'
  },
  batterChipName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1'
  },
  batterChipRuns: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8'
  },
  batterChipTextActive: {
    color: '#ffffff'
  },
  batterChipRunsActive: {
    color: '#e0f2fe'
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    marginRight: 4
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155'
  },
  filterPillActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#60a5fa'
  },
  filterPillActiveSix: {
    backgroundColor: '#be185d',
    borderColor: '#ec4899'
  },
  filterPillActiveFour: {
    backgroundColor: '#047857',
    borderColor: '#10b981'
  },
  filterPillActiveThree: {
    backgroundColor: '#b45309',
    borderColor: '#f59e0b'
  },
  filterPillActiveTwo: {
    backgroundColor: '#1d4ed8',
    borderColor: '#3b82f6'
  },
  filterPillActiveOne: {
    backgroundColor: '#0e7490',
    borderColor: '#06b6d4'
  },
  filterPillActiveDot: {
    backgroundColor: '#475569',
    borderColor: '#94a3b8'
  },
  dotMarker: {
    width: 7,
    height: 7,
    borderRadius: 4
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cbd5e1'
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: 'bold'
  },
  mainLayout: {
    flexDirection: 'column',
    gap: 20
  },
  mainLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  wheelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  groundContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#02140a'
  },
  shotTooltip: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderColor: '#334155',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    width: 220,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 8
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  tooltipBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  tooltipClose: {
    padding: 2
  },
  tooltipCloseText: {
    color: '#94a3b8',
    fontSize: 12
  },
  tooltipPosition: {
    fontSize: 11,
    color: '#f8fafc',
    fontWeight: '600'
  },
  tooltipBall: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2
  },
  tooltipComm: {
    fontSize: 10,
    color: '#cbd5e1',
    fontStyle: 'italic',
    marginTop: 4
  },
  clearFilterBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  clearFilterText: {
    fontSize: 11,
    color: '#fca5a5',
    fontWeight: 'bold'
  },
  analyticsWrapper: {
    flex: 1,
    gap: 14
  },
  balanceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155'
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  balanceTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f1f5f9'
  },
  balanceTotalRuns: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981'
  },
  duelBarTrack: {
    height: 26,
    borderRadius: 6,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#475569'
  },
  duelBarOff: {
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  duelBarLeg: {
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center'
  },
  duelBarText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  balanceDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  offDetailText: {
    fontSize: 11,
    color: '#7dd3fc'
  },
  legDetailText: {
    fontSize: 11,
    color: '#fdba74'
  },
  boldText: {
    fontWeight: 'bold',
    color: '#ffffff'
  },
  sectorTableCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155'
  },
  sectorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 4
  },
  sectorCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f1f5f9'
  },
  sectorCardHint: {
    fontSize: 10,
    color: '#94a3b8'
  },
  sectorGrid: {
    gap: 8
  },
  sectorRowItem: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  sectorRowSelected: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(2, 132, 199, 0.15)'
  },
  sectorRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectorNameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  sectorColorDot: {
    width: 9,
    height: 9,
    borderRadius: 5
  },
  sectorNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0'
  },
  sectorNameActive: {
    color: '#38bdf8',
    fontWeight: 'bold'
  },
  sectorValueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  sectorRunsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f8fafc'
  },
  sectorPctBadge: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  sectorBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1e293b',
    marginVertical: 6,
    overflow: 'hidden'
  },
  sectorBarFill: {
    height: '100%',
    borderRadius: 3
  },
  sectorSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectorSubText: {
    fontSize: 10,
    color: '#64748b'
  },
  sectorSideBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    backgroundColor: '#1e293b',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  }
});
