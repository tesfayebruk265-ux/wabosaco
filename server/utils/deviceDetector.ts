import crypto from 'crypto';

export interface DeviceInfo {
  browser: string;
  os: string;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN';
  deviceName: string;
  fingerprint: string;
  deviceFingerprint: string;
  ipAddress: string;
  country: string;
  city: string;
  location: string;
}

export const deviceDetector = {
  parseDeviceInfo(userAgent = '', ip = '127.0.0.1', clientFingerprint?: string): DeviceInfo {
    const ua = userAgent.toLowerCase();

    // 1. Browser Detection
    let browser = 'Unknown Browser';
    if (ua.includes('edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Google Chrome';
    else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Apple Safari';
    else if (ua.includes('firefox/')) browser = 'Mozilla Firefox';
    else if (ua.includes('opera/') || ua.includes('opr/')) browser = 'Opera';
    else if (ua.includes('curl/') || ua.includes('postman')) browser = 'API Client / CLI';

    // 2. OS Detection
    let os = 'Unknown OS';
    if (ua.includes('windows nt 10.0')) os = 'Windows 11 / 10';
    else if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os x')) os = 'macOS';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) os = 'iOS';
    else if (ua.includes('linux')) os = 'Linux';

    // 3. Device Type
    let deviceType: DeviceInfo['deviceType'] = 'DESKTOP';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      deviceType = 'MOBILE';
    } else if (ua.includes('ipad') || ua.includes('tablet')) {
      deviceType = 'TABLET';
    }

    // 4. Device Name
    let deviceName = `${browser} on ${os}`;
    if (deviceType === 'MOBILE') {
      deviceName = ua.includes('iphone') ? `iPhone (${browser})` : `Android Mobile (${browser})`;
    } else if (deviceType === 'TABLET') {
      deviceName = `Tablet (${browser})`;
    }

    // 5. Deterministic Device Fingerprint
    const rawFingerprint = clientFingerprint || `${browser}|${os}|${deviceType}|${ip.split('.').slice(0, 2).join('.')}`;
    const fingerprint = 'dfp_' + crypto.createHash('sha256').update(rawFingerprint).digest('hex').substring(0, 16);

    // 6. Geolocation context (Ethiopian banking SACCO branches default / simulation)
    let country = 'Ethiopia';
    let city = 'Addis Ababa';

    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '127.0.0.1' || ip === '::1') {
      country = 'Ethiopia';
      city = 'Addis Ababa (Headquarters LAN)';
    } else if (ip.endsWith('.10') || ip.endsWith('.11')) {
      city = 'Hawassa Branch';
    } else if (ip.endsWith('.20') || ip.endsWith('.21')) {
      city = 'Bahir Dar Branch';
    } else if (ip.endsWith('.30') || ip.endsWith('.31')) {
      city = 'Dire Dawa Branch';
    } else if (ip.endsWith('.99')) {
      country = 'International';
      city = 'Unknown Gateway';
    }

    const location = `${city}, ${country}`;

    return {
      browser,
      os,
      deviceType,
      deviceName,
      fingerprint,
      deviceFingerprint: fingerprint,
      ipAddress: ip,
      country,
      city,
      location,
    };
  },
};

export const detectClientEnvironment = (userAgent = '', ip = '127.0.0.1', clientFingerprint?: string): DeviceInfo => {
  return deviceDetector.parseDeviceInfo(userAgent, ip, clientFingerprint);
};
