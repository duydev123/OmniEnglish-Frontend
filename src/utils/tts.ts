import React from 'react'

/**
 * Map collection language string (e.g., 'Anh-Mỹ', 'Anh-Anh', 'Anh-Úc', 'en-US', 'en-GB')
 * to standard BCP 47 language code for Web Speech API.
 */
export const getLangCode = (languageName?: string): string => {
  if (!languageName || typeof languageName !== 'string') return 'en-US'
  const lang = languageName.trim().toLowerCase()

  if (lang.includes('anh-anh') || lang.includes('en-gb') || lang.includes('british') || lang.includes('uk')) {
    return 'en-GB'
  }
  if (lang.includes('anh-mỹ') || lang.includes('anh-my') || lang.includes('en-us') || lang.includes('american') || lang.includes('us')) {
    return 'en-US'
  }
  if (/^[a-z]{2}-[a-z]{2}$/i.test(languageName)) {
    return languageName
  }
  return 'en-US'
}

/**
 * Text-To-Speech helper function that selects appropriate accent/voice for given language.
 */
export const speakText = (text: string, languageName?: string, rate: number = 1.0, e?: React.MouseEvent) => {
  if (e) e.stopPropagation()
  if (!('speechSynthesis' in window) || !text) return

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  const targetLang = getLangCode(languageName)
  utterance.lang = targetLang
  utterance.rate = rate

  const playUtterance = () => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      const targetLower = (targetLang || '').toLowerCase()
      const langPrefix = targetLower.slice(0, 2)

      const matchingVoice =
        voices.find(v => (v.lang || '').toLowerCase() === targetLower) ||
        voices.find(v => (v.lang || '').toLowerCase().startsWith(targetLower)) ||
        voices.find(v => (v.lang || '').toLowerCase().startsWith(langPrefix))

      if (matchingVoice) {
        utterance.voice = matchingVoice
      }
    }
    window.speechSynthesis.speak(utterance)
  }

  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0 && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null
      playUtterance()
    }
  } else {
    playUtterance()
  }
}
