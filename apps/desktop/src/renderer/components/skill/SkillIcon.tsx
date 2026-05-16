import { useState, useMemo } from 'react';
import { CuboidIcon } from 'lucide-react';

interface SkillIconProps {
  iconUrl?: string;
  iconEmoji?: string;
  backgroundColor?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-sm', emoji: 'text-lg' },
  md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-base', emoji: 'text-xl' },
  lg: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-lg', emoji: 'text-2xl' },
  xl: { container: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-xl', emoji: 'text-3xl' },
};

// Generate a consistent color from skill name
// 根据技能名称生成一致的颜色
const COLORS = [
  'bg-blue-500/15 text-blue-500',
  'bg-purple-500/15 text-purple-500',
  'bg-green-500/15 text-green-500',
  'bg-orange-500/15 text-orange-500',
  'bg-pink-500/15 text-pink-500',
  'bg-cyan-500/15 text-cyan-500',
  'bg-indigo-500/15 text-indigo-500',
  'bg-amber-500/15 text-amber-500',
  'bg-teal-500/15 text-teal-500',
  'bg-rose-500/15 text-rose-500',
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getAccessibleForegroundColor(backgroundColor: string): string {
  const normalized = backgroundColor.trim();
  const hex = normalized.startsWith("#") ? normalized.slice(1) : normalized;
  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    return "rgb(15 23 42)";
  }

  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  return luminance > 0.72 ? "rgb(30 41 59)" : "rgb(248 250 252)";
}

/**
 * Skill icon component with fallback chain: URL → Emoji → Initial → Default
 * 技能图标组件，降级链：URL → Emoji → 首字母 → 默认图标
 */
export function SkillIcon({
  iconUrl,
  iconEmoji,
  backgroundColor,
  name,
  size = 'md',
  className = '',
}: SkillIconProps) {
  const [imgError, setImgError] = useState(false);
  const sizeConfig = SIZE_MAP[size];
  const colorClass = useMemo(() => getColorFromName(name), [name]);
  const initial = name.charAt(0).toUpperCase();
  const hasCustomBackground = Boolean(backgroundColor);
  const customForegroundColor = backgroundColor
    ? getAccessibleForegroundColor(backgroundColor)
    : undefined;
  const containerClass = hasCustomBackground
    ? 'bg-transparent'
    : colorClass;
  const containerStyle = backgroundColor
    ? { backgroundColor, color: customForegroundColor }
    : undefined;

  // Priority 1: URL icon
  if (iconUrl && !imgError) {
    return (
      <div
        className={`${sizeConfig.container} rounded-xl overflow-hidden flex items-center justify-center ${containerClass} ${className}`}
        style={containerStyle}
      >
        <img
          src={iconUrl}
          alt={name}
          className={`${sizeConfig.icon} object-contain dark:invert`}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Priority 2: Emoji icon
  if (iconEmoji) {
    return (
      <div
        className={`${sizeConfig.container} rounded-xl flex items-center justify-center ${containerClass} ${className}`}
        style={containerStyle}
      >
        <span className={sizeConfig.emoji} role="img" aria-label={name}>
          {iconEmoji}
        </span>
      </div>
    );
  }

  // Priority 3: Name initial with colored background
  if (name) {
    return (
      <div
        className={`${sizeConfig.container} rounded-xl flex items-center justify-center font-bold ${containerClass} ${className}`}
        style={containerStyle}
      >
        <span className={sizeConfig.text}>{initial}</span>
      </div>
    );
  }

  // Priority 4: Default CuboidIcon
  return (
      <div
        className={`${sizeConfig.container} rounded-xl flex items-center justify-center ${hasCustomBackground ? 'bg-transparent' : 'bg-primary/10 text-primary'} ${className}`}
        style={containerStyle}
      >
      <CuboidIcon className={sizeConfig.icon} />
    </div>
  );
}
