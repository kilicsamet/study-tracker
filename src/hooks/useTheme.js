import { useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Saat (0-23) + hava durumu → gerçek gökyüzü gradient
// Her kombinasyon için "body { background: gradient }" üretiyoruz.
// ─────────────────────────────────────────────────────────────────────────────

// Açık hava gökyüzü renkleri saate göre
function getClearGradient(hour) {
  if (hour >= 5 && hour < 7) {
    // Şafak - koyu mavi + turuncu/pembe
    return 'linear-gradient(to bottom, #0d1b3e 0%, #1a3a6b 20%, #c45c2a 55%, #e8864a 75%, #f5b87a 100%)'
  }
  if (hour >= 7 && hour < 9) {
    // Gün doğumu - pembe/sarı/açık mavi
    return 'linear-gradient(to bottom, #1a2a5e 0%, #3a6fb5 25%, #f0a060 55%, #f8c878 75%, #fde8b0 100%)'
  }
  if (hour >= 9 && hour < 11) {
    // Sabah - açık mavi, altın ışık
    return 'linear-gradient(to bottom, #1a4a8a 0%, #2e74c0 35%, #5aa0e0 65%, #aed6f8 100%)'
  }
  if (hour >= 11 && hour < 14) {
    // Öğle - derin parlak mavi
    return 'linear-gradient(to bottom, #0e3a7a 0%, #1a5cbc 30%, #3a8ade 60%, #7abef5 100%)'
  }
  if (hour >= 14 && hour < 17) {
    // Öğleden sonra - parlak mavi biraz soluk
    return 'linear-gradient(to bottom, #143070 0%, #1e5ab0 35%, #4a90d8 65%, #90c8f8 100%)'
  }
  if (hour >= 17 && hour < 19) {
    // Gün batımı - turuncu/mor/pembe
    return 'linear-gradient(to bottom, #1a1040 0%, #4a1878 25%, #c03060 50%, #e87040 72%, #f8b060 100%)'
  }
  if (hour >= 19 && hour < 21) {
    // Alacakaranlık - mor/lacivert/turuncu
    return 'linear-gradient(to bottom, #0d0820 0%, #2a1050 30%, #6a2060 55%, #c05830 78%, #e89050 100%)'
  }
  if (hour >= 21 && hour < 23) {
    // Erken gece - koyu mor/lacivert
    return 'linear-gradient(to bottom, #06040e 0%, #0d0820 30%, #160c30 65%, #1e1040 100%)'
  }
  // Gece yarısı / çok erken sabah
  return 'linear-gradient(to bottom, #04030a 0%, #080614 30%, #0e0920 65%, #150d2c 100%)'
}

// Bulutlu hava saate göre (daha gri/pastel tonlar)
function getCloudyGradient(hour) {
  if (hour >= 5 && hour < 8) {
    return 'linear-gradient(to bottom, #1a1e2e 0%, #2e3a50 30%, #7a7e8e 65%, #a8aab8 100%)'
  }
  if (hour >= 8 && hour < 12) {
    // Saat 10 bulutlu → istediğin bu: açık gri-mavi
    return 'linear-gradient(to bottom, #2a3a50 0%, #4a6070 30%, #7a9aaa 60%, #b0c4d0 100%)'
  }
  if (hour >= 12 && hour < 17) {
    return 'linear-gradient(to bottom, #283848 0%, #405868 30%, #6e8e9e 60%, #a8c0cc 100%)'
  }
  if (hour >= 17 && hour < 20) {
    return 'linear-gradient(to bottom, #1a1828 0%, #302838 30%, #5a5068 60%, #7a7088 100%)'
  }
  return 'linear-gradient(to bottom, #080810 0%, #10101e 30%, #1a1a2e 65%, #22203a 100%)'
}

// Yağmurlu - koyu, kasvetli
function getRainGradient(hour) {
  if (hour >= 6 && hour < 12) {
    return 'linear-gradient(to bottom, #141820 0%, #202830 30%, #384048 60%, #505860 100%)'
  }
  if (hour >= 12 && hour < 18) {
    return 'linear-gradient(to bottom, #101418 0%, #1c2228 30%, #303840 60%, #485058 100%)'
  }
  if (hour >= 18 && hour < 22) {
    return 'linear-gradient(to bottom, #0a0c10 0%, #141618 30%, #202428 60%, #2c3034 100%)'
  }
  return 'linear-gradient(to bottom, #060608 0%, #0c0e12 30%, #141618 65%, #1c1e22 100%)'
}

// Karlı - buz mavisi, beyazımsı
function getSnowGradient(hour) {
  if (hour >= 6 && hour < 12) {
    return 'linear-gradient(to bottom, #1e2a40 0%, #3a4e68 30%, #7a96b0 60%, #c0d4e4 100%)'
  }
  if (hour >= 12 && hour < 17) {
    return 'linear-gradient(to bottom, #1c2838 0%, #344a60 30%, #6e90a8 60%, #b8d0e0 100%)'
  }
  if (hour >= 17 && hour < 21) {
    return 'linear-gradient(to bottom, #121820 0%, #202c3a 30%, #404e5e 60%, #606e7e 100%)'
  }
  return 'linear-gradient(to bottom, #0a0e14 0%, #141a22 30%, #202830 65%, #2a3240 100%)'
}

// Fırtınalı - neredeyse siyah, yeşilimsi/morumsu
function getThunderstormGradient(hour) {
  if (hour >= 6 && hour < 18) {
    return 'linear-gradient(to bottom, #080a08 0%, #101408 25%, #181e10 55%, #202414 100%)'
  }
  return 'linear-gradient(to bottom, #040404 0%, #080808 30%, #0c0c0c 65%, #101010 100%)'
}

// Sisli/puslu
function getMistGradient(hour) {
  if (hour >= 5 && hour < 10) {
    return 'linear-gradient(to bottom, #1e2430 0%, #384450 30%, #6a7a88 55%, #9aaab8 80%, #c0ccd8 100%)'
  }
  if (hour >= 10 && hour < 17) {
    return 'linear-gradient(to bottom, #242e3a 0%, #3e4e5a 30%, #6a7e8e 55%, #9ab0be 100%)'
  }
  if (hour >= 17 && hour < 21) {
    return 'linear-gradient(to bottom, #181820 0%, #28283a 30%, #484858 55%, #646475 100%)'
  }
  return 'linear-gradient(to bottom, #0c0c14 0%, #14141e 30%, #1e1e2c 65%, #282838 100%)'
}

// Drizzle (çiseleyen yağmur) - yağmurdan biraz daha açık
function getDrizzleGradient(hour) {
  if (hour >= 6 && hour < 12) {
    return 'linear-gradient(to bottom, #1a2030 0%, #2c3a48 30%, #4a5e6e 60%, #6a7e8e 100%)'
  }
  if (hour >= 12 && hour < 18) {
    return 'linear-gradient(to bottom, #161e28 0%, #283040 30%, #405060 60%, #5a6e7e 100%)'
  }
  if (hour >= 18 && hour < 22) {
    return 'linear-gradient(to bottom, #0e1018 0%, #181c24 30%, #282e38 60%, #363c48 100%)'
  }
  return 'linear-gradient(to bottom, #080a0e 0%, #10121a 30%, #181c24 65%, #202430 100%)'
}

// ─── Ana fonksiyon ─────────────────────────────────────────────────────────
function getSkyGradient(weather, hour) {
  switch (weather) {
    case 'Clear':        return getClearGradient(hour)
    case 'Clouds':       return getCloudyGradient(hour)
    case 'Rain':         return getRainGradient(hour)
    case 'Snow':         return getSnowGradient(hour)
    case 'Thunderstorm': return getThunderstormGradient(hour)
    case 'Drizzle':      return getDrizzleGradient(hour)
    case 'Mist':
    case 'Fog':
    case 'Haze':         return getMistGradient(hour)
    default:
      // Hava durumu henüz yüklenmediyse saate göre açık hava gibi davran
      return getClearGradient(hour)
  }
}

// ─── Surface/surface2/surface3 de saate göre değişsin ─────────────────────
// Gündüz daha aydınlık surface, gece koyu
function getSurfaceVars(weather, hour) {
  const isDay   = hour >= 7 && hour < 20
  const isRainy = ['Rain','Drizzle','Thunderstorm'].includes(weather)
  const isSnowy = weather === 'Snow'

  if (isRainy) {
    return {
      '--surface':  'rgba(20, 28, 38, 0.80)',
      '--surface2': 'rgba(30, 40, 52, 0.80)',
      '--surface3': 'rgba(42, 54, 68, 0.80)',
      '--border':   'rgba(255,255,255,0.08)',
      '--border2':  'rgba(255,255,255,0.14)',
    }
  }
  if (isSnowy) {
    return {
      '--surface':  'rgba(24, 32, 50, 0.80)',
      '--surface2': 'rgba(34, 44, 64, 0.80)',
      '--surface3': 'rgba(46, 58, 78, 0.80)',
      '--border':   'rgba(255,255,255,0.10)',
      '--border2':  'rgba(255,255,255,0.18)',
    }
  }
  if (isDay) {
    return {
      '--surface':  'rgba(10, 20, 40, 0.70)',
      '--surface2': 'rgba(16, 28, 52, 0.70)',
      '--surface3': 'rgba(22, 36, 64, 0.70)',
      '--border':   'rgba(255,255,255,0.12)',
      '--border2':  'rgba(255,255,255,0.20)',
    }
  }
  // Gece
  return {
    '--surface':  'rgba(18, 14, 32, 0.82)',
    '--surface2': 'rgba(26, 20, 46, 0.82)',
    '--surface3': 'rgba(36, 28, 60, 0.82)',
    '--border':   'rgba(255,255,255,0.07)',
    '--border2':  'rgba(255,255,255,0.13)',
  }
}

// ─── React hook ────────────────────────────────────────────────────────────
export default function useTheme(weather, timeOfDay) {
  useEffect(() => {
    const hour = new Date().getHours()
    const root = document.documentElement

    // Gökyüzü gradient'i body'ye ver
    const gradient = getSkyGradient(weather, hour)
    root.style.setProperty('--sky-gradient', gradient)

    // Surface renkleri
    const surfaces = getSurfaceVars(weather, hour)
    Object.entries(surfaces).forEach(([k, v]) => root.style.setProperty(k, v))

    // Gündüz/gece text renkleri
    const isDay = hour >= 7 && hour < 20
    if (isDay && weather !== 'Thunderstorm') {
      root.style.setProperty('--text',  '#f0ecf8')
      root.style.setProperty('--text2', '#c8b8e0')
      root.style.setProperty('--text3', '#9080b0')
    } else {
      root.style.setProperty('--text',  '#f2edf8')
      root.style.setProperty('--text2', '#b5a8cc')
      root.style.setProperty('--text3', '#7a6e94')
    }
  }, [weather, timeOfDay])
}