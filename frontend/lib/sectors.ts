export type SectorChannel =
  | 'voice_phone'
  | 'email'
  | 'slack_teams'
  | 'qr_code'
  | 'cloud_oauth'
  | 'sms_push'
  | 'physical_media';

export interface SectorConfig {
  channel: SectorChannel;
  label: string;
  recommendedSituation: string;
  description: string;
  iconName: 'Phone' | 'Mail' | 'MessageSquare' | 'QrCode' | 'Cloud' | 'Smartphone' | 'HardDrive';
  color: 'cyan' | 'blue' | 'teal' | 'amber' | 'coral' | 'muted';
}

export const SECTORS: SectorConfig[] = [
  {
    channel: 'voice_phone',
    label: 'Voice & Vishing',
    recommendedSituation: 'Voice Intercept',
    description: 'Telephony fraud & urgent executive impersonation',
    iconName: 'Phone',
    color: 'cyan',
  },
  {
    channel: 'email',
    label: 'Email & BEC',
    recommendedSituation: 'Wire Transfer Lure',
    description: 'Business email compromise & lookalike spoofing',
    iconName: 'Mail',
    color: 'blue',
  },
  {
    channel: 'slack_teams',
    label: 'Slack / Teams',
    recommendedSituation: 'Token Harvest',
    description: 'Direct message compromise & link infiltration',
    iconName: 'MessageSquare',
    color: 'teal',
  },
  {
    channel: 'qr_code',
    label: 'QR / Quishing',
    recommendedSituation: 'Printer Notice',
    description: 'Physical workplace flyer with obfuscated URL',
    iconName: 'QrCode',
    color: 'amber',
  },
  {
    channel: 'cloud_oauth',
    label: 'Cloud & OAuth',
    recommendedSituation: 'NovaSync Consent',
    description: 'Third-party consent hijacking & scope abuse',
    iconName: 'Cloud',
    color: 'blue',
  },
  {
    channel: 'sms_push',
    label: 'MFA Fatigue & Push',
    recommendedSituation: 'Push Bombing',
    description: 'Repeated authentication prompts & credential abuse',
    iconName: 'Smartphone',
    color: 'coral',
  },
  {
    channel: 'physical_media',
    label: 'Physical Media',
    recommendedSituation: 'USB Drop',
    description: 'Rogue peripheral device & workstation auto-run',
    iconName: 'HardDrive',
    color: 'muted',
  },
];

export const SECTOR_MAP: Record<string, SectorConfig> = SECTORS.reduce((acc, sec) => {
  acc[sec.channel] = sec;
  return acc;
}, {} as Record<string, SectorConfig>);

export function getSectorConfig(channel?: string | null): SectorConfig {
  if (channel && SECTOR_MAP[channel]) {
    return SECTOR_MAP[channel];
  }
  // Default to Cloud & OAuth or Email if not found
  return SECTOR_MAP['cloud_oauth'] || SECTORS[0];
}
