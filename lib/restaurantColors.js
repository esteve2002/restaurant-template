function parseColor(value) {
  if (typeof value !== "string") return null;
  const hexMatch = value.trim().match(/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i);
  let channels;

  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length <= 4) hex = [...hex].map((digit) => digit + digit).join("");
    channels = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
    const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return channels.map((channel) => channel * alpha + 255 * (1 - alpha));
  }

  const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/i);
  if (!rgbMatch) return null;
  const values = rgbMatch[1].trim().split(/[,\s/]+/).filter(Boolean);
  if (values.length < 3) return null;
  const alphaValue = values[3] ? Number.parseFloat(values[3]) : 1;
  const alpha = Number.isFinite(alphaValue) ? Math.min(1, Math.max(0, alphaValue)) : 1;
  channels = values.slice(0, 3).map((channel) => {
    const parsed = Number.parseFloat(channel);
    return channel.endsWith("%") ? parsed * 2.55 : parsed;
  });
  if (channels.some((channel) => !Number.isFinite(channel))) return null;
  return channels.map((channel) => channel * alpha + 255 * (1 - alpha));
}

export function contrastOnWhite(color) {
  const channels = parseColor(color);
  if (!channels) return 0;
  const luminance = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  }).reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return 1.05 / (luminance + 0.05);
}

export function colorSaturation(color) {
  const channels = parseColor(color);
  if (!channels) return 0;
  const maximum = Math.max(...channels);
  return maximum ? (maximum - Math.min(...channels)) / maximum : 0;
}