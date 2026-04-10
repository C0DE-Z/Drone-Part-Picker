import { DronePartCategory, LegacyProductCategory, ParsedDetailData, RawListingProduct } from './types';

export interface ClassificationResult {
  category: DronePartCategory;
  legacyCategory: LegacyProductCategory;
  confidence: number;
  reasons: string[];
  scores: Record<DronePartCategory, number>;
}

const CATEGORY_LIST: DronePartCategory[] = [
  'frame',
  'motor',
  'flight_controller',
  'esc',
  'aio',
  'vtx',
  'camera',
  'receiver',
  'propeller',
  'battery',
  'antenna',
  'stack',
  'gps',
  'action_camera_mount',
  'accessory',
  'unknown'
];

const listingHintMap: Record<string, DronePartCategory> = {
  motors: 'motor',
  frames: 'frame',
  stacks: 'stack',
  cameras: 'camera',
  props: 'propeller',
  propellers: 'propeller',
  batteries: 'battery'
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const hasAny = (text: string, patterns: RegExp[]): boolean => patterns.some((pattern) => pattern.test(text));

const addScore = (
  scores: Record<DronePartCategory, number>,
  category: DronePartCategory,
  points: number,
  reason: string,
  reasons: string[]
): void => {
  scores[category] += points;
  reasons.push(reason);
};

const mapToLegacyCategory = (category: DronePartCategory): LegacyProductCategory => {
  switch (category) {
    case 'motor':
      return 'motor';
    case 'frame':
      return 'frame';
    case 'propeller':
      return 'prop';
    case 'battery':
      return 'battery';
    case 'camera':
    case 'vtx':
      return 'camera';
    case 'flight_controller':
    case 'esc':
    case 'aio':
    case 'stack':
      return 'stack';
    default:
      return 'other';
  }
};

export const classifyDroneProduct = (
  listing: RawListingProduct,
  details: ParsedDetailData
): ClassificationResult => {
  const text = `${listing.rawName} ${listing.rawDescription || ''} ${details.title || ''} ${details.description || ''} ${Object.keys(details.specificationPairs).join(' ')} ${Object.values(details.specificationPairs).join(' ')} ${details.bulletLines.join(' ')}`.toLowerCase();

  const scores = CATEGORY_LIST.reduce((acc, category) => {
    acc[category] = 0;
    return acc;
  }, {} as Record<DronePartCategory, number>);

  const reasons: string[] = [];

  const listingHint = listingHintMap[listing.listingCategoryKey.toLowerCase()];
  if (listingHint) {
    addScore(scores, listingHint, 14, `Listing path suggests ${listingHint}`, reasons);
  }

  // Motors
  if (hasAny(text, [/\bkv\b/, /\bstator\b/, /\bbrushless\b/, /\b22\d{2}\b/, /\b23\d{2}\b/, /\bmotor\b/])) {
    addScore(scores, 'motor', 18, 'Motor keywords/specs detected', reasons);
  }

  // Frames
  if (hasAny(text, [/\bframe\b/, /\bwheelbase\b/, /\bchassis\b/, /\barm thickness\b/, /\bcarbon\b/])) {
    addScore(scores, 'frame', 16, 'Frame-specific terms detected', reasons);
  }

  // Props
  if (hasAny(text, [/\bprop\b/, /\bpropeller\b/, /\btri[-\s]?blade\b/, /\b2\.\d{1,2}x\d\.?\d?\b/, /\b5x\d\.?\d?\b/])) {
    addScore(scores, 'propeller', 17, 'Propeller patterns detected', reasons);
  }

  // Battery
  if (hasAny(text, [/\blipo\b/, /\bli-ion\b/, /\bmah\b/, /\b\d+s\b/, /\bc[-\s]?rating\b/, /\bbattery\b/])) {
    addScore(scores, 'battery', 18, 'Battery indicators detected', reasons);
  }

  // Camera / VTX
  if (hasAny(text, [/\bcamera\b/, /\bfov\b/, /\btvl\b/, /\blatency\b/, /\bfpv cam\b/])) {
    addScore(scores, 'camera', 14, 'Camera terms detected', reasons);
  }
  if (hasAny(text, [/\bvtx\b/, /\bvideo transmitter\b/, /\b5\.8g\b/, /\bpit mode\b/, /\b25mw\b/, /\b800mw\b/])) {
    addScore(scores, 'vtx', 18, 'VTX terms detected', reasons);
  }

  // Flight controller / ESC / AIO / Stack
  if (hasAny(text, [/\bflight controller\b/, /\bfc\b/, /\bf4\b/, /\bf7\b/, /\bh7\b/, /\bgyro\b/])) {
    addScore(scores, 'flight_controller', 15, 'Flight controller indicators detected', reasons);
  }

  if (hasAny(text, [/\b4[-\s]?in[-\s]?1\b/, /\besc\b/, /\bblheli\b/, /\bamp\b/])) {
    addScore(scores, 'esc', 14, 'ESC indicators detected', reasons);
  }

  if (hasAny(text, [/\baio\b/, /\ball[-\s]?in[-\s]?one\b/])) {
    addScore(scores, 'aio', 18, 'AIO indicator detected', reasons);
  }

  if (hasAny(text, [/\bstack\b/, /\bfc\/esc\b/, /\bflight controller stack\b/])) {
    addScore(scores, 'stack', 18, 'Stack indicator detected', reasons);
  }

  // RX / Antenna / GPS
  if (hasAny(text, [/\breceiver\b/, /\belrs\b/, /\bcrossfire\b/, /\btrx\b/])) {
    addScore(scores, 'receiver', 15, 'Receiver indicators detected', reasons);
  }

  if (hasAny(text, [/\bantenna\b/, /\bu\.fl\b/, /\bsma\b/, /\brhcp\b/, /\blhcp\b/])) {
    addScore(scores, 'antenna', 14, 'Antenna indicators detected', reasons);
  }

  if (hasAny(text, [/\bgps\b/, /\bgnss\b/, /\bublox\b/, /\bcompass\b/])) {
    addScore(scores, 'gps', 16, 'GPS indicators detected', reasons);
  }

  // Action camera mounts & accessory fallback
  if (hasAny(text, [/\bgopro mount\b/, /\baction camera mount\b/, /\bmount for hero\b/])) {
    addScore(scores, 'action_camera_mount', 20, 'Action camera mount indicators detected', reasons);
  }

  if (hasAny(text, [/\bmount\b/, /\bstrap\b/, /\bhardware\b/, /\bspare\b/, /\baccessory\b/, /\bkit\b/])) {
    addScore(scores, 'accessory', 8, 'Accessory indicators detected', reasons);
  }

  // Conflict correction rules
  if (scores.motor > 0 && hasAny(text, [/\bmount\b/, /\bmotor mount\b/])) {
    scores.motor -= 8;
    scores.accessory += 8;
    reasons.push('Reduced motor confidence due to mount/accessory context');
  }

  if (scores.camera > 0 && hasAny(text, [/\baction camera\b/, /\bgopro\b/])) {
    scores.action_camera_mount += 10;
    reasons.push('Action camera context detected');
  }

  if (scores.flight_controller > 0 && scores.esc > 0) {
    scores.stack += 10;
    reasons.push('FC + ESC combination detected; stack confidence increased');
  }

  if (scores.aio > 0 && (scores.flight_controller > 0 || scores.esc > 0)) {
    scores.aio += 8;
    reasons.push('AIO with FC/ESC context detected');
  }

  // Determine winner
  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a) as Array<[DronePartCategory, number]>;

  const [winnerCategory, winnerScore] = sorted[0] || ['unknown', 0];
  const secondScore = sorted[1]?.[1] || 0;

  let category: DronePartCategory = winnerCategory;
  if (winnerScore <= 0) {
    category = 'unknown';
  }

  const margin = winnerScore - secondScore;
  const confidence = category === 'unknown'
    ? 30
    : clamp(55 + winnerScore + margin * 2, 35, 98);

  return {
    category,
    legacyCategory: mapToLegacyCategory(category),
    confidence,
    reasons: [...new Set(reasons)].slice(0, 6),
    scores
  };
};
