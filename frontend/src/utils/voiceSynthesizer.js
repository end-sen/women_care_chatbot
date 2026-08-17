/**
 * Voice Synthesizer Utility Module
 * Supports multi-language speech synthesis with expanded African language coverage
 */

export const SUPPORTED_LANGUAGES = [
  // African Languages & Dialects
  { code: 'sw-KE', name: 'Swahili - Kiswahili (Kenya/Tanzania)', flag: '🇰🇪' },
  { code: 'am-ET', name: 'Amharic - አማርኛ (Ethiopia)', flag: '🇪🇹' },
  { code: 'yo-NG', name: 'Yoruba - Èdè Yorùbá (Nigeria)', flag: '🇳🇬' },
  { code: 'ig-NG', name: 'Igbo - Asụsụ Igbo (Nigeria)', flag: '🇳🇬' },
  { code: 'ha-NG', name: 'Hausa - Harshen Hausa (Nigeria/Niger)', flag: '🇳🇬' },
  { code: 'zu-ZA', name: 'Zulu - isiZulu (South Africa)', flag: '🇿🇦' },
  { code: 'xh-ZA', name: 'Xhosa - isiXhosa (South Africa)', flag: '🇿🇦' },
  { code: 'af-ZA', name: 'Afrikaans (South Africa)', flag: '🇿🇦' },
  { code: 'so-SO', name: 'Somali - Soomaali (Somalia/Ethiopia)', flag: '🇸🇴' },
  { code: 'om-ET', name: 'Oromo - Afaan Oromoo (Ethiopia)', flag: '🇪🇹' },
  { code: 'lg-UG', name: 'Luganda - Oluganda (Uganda)', flag: '🇺🇬' },
  { code: 'sn-ZW', name: 'Shona - chiShona (Zimbabwe)', flag: '🇿🇼' },
  { code: 'rw-RW', name: 'Kinyarwanda (Rwanda)', flag: '🇷🇼' },
  { code: 'rn-BI', name: 'Kirundi (Burundi)', flag: '🇧🇮' },
  { code: 'st-ZA', name: 'Sesotho - Southern Sotho (South Africa)', flag: '🇿🇦' },
  { code: 'tn-ZA', name: 'Setswana - Tswana (South Africa/Botswana)', flag: '🇿🇦' },
  { code: 'ln-CD', name: 'Lingala (DR Congo)', flag: '🇨🇩' },
  { code: 'wo-SN', name: 'Wolof (Senegal)', flag: '🇸🇳' },
  { code: 'mg-MG', name: 'Malagasy (Madagascar)', flag: '🇲🇬' },
  { code: 'ti-ET', name: 'Tigrinya - ትግርኛ (Ethiopia/Eritrea)', flag: '🇪🇹' },
  { code: 'ar-EG', name: 'Egyptian Arabic - العربية المصرية (Egypt)', flag: '🇪🇬' },
  { code: 'ar-MA', name: 'Moroccan Arabic - Darija (Morocco)', flag: '🇲🇦' },
  { code: 'fr-CI', name: 'African French - Français (Côte d\'Ivoire)', flag: '🇨🇮' },

  // Global Primary Languages
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'fr-FR', name: 'French (Français)', flag: '🇫🇷' },
  { code: 'es-ES', name: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'pt-BR', name: 'Portuguese (Português)', flag: '🇧🇷' },
  { code: 'hi-IN', name: 'Hindi (हिन्दी)', flag: '🇮🇳' },
  { code: 'ar-SA', name: 'Arabic - Standard (العربية)', flag: '🇸🇦' }
];

export const PROPLUS_NOVA_PROFILE = {
  id: 'proplus-nova',
  name: 'proplus-Nova',
  engine: 'Neural / ProPlus',
  provider: 'Voicemaker AI',
  pitch: 1.08,
  rate: 0.98,
  volume: 1.0
};

/**
 * Retrieves all installed voices from the browser
 */
export function getAllAvailableVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices() || [];
}

/**
 * Finds the best matching female/natural voice for a given language code or voice URI
 */
/**
 * Finds the best matching voice for the ProPlus Nova persona across languages.
 * Prioritizes Nova/ProPlus voices globally first, then preferred natural female voices,
 * maintaining a consistent ProPlus Nova voice persona across language selections.
 */
export function getVoiceForLanguage(langCode = 'en-US', voiceURI = '') {
  const voices = getAllAvailableVoices();
  if (!voices || voices.length === 0) return null;

  // 1. If exact voiceURI requested by user
  if (voiceURI) {
    const exactVoice = voices.find(v => v.voiceURI === voiceURI);
    if (exactVoice) return exactVoice;
  }

  // 2. Global search for Nova / ProPlus voice across ALL installed browser voices
  const globalNova = voices.find(v => {
    const nameLower = v.name.toLowerCase();
    return nameLower.includes('nova') || nameLower.includes('proplus') || nameLower.includes('pro-plus');
  });
  if (globalNova) return globalNova;

  const cleanLang = (langCode || 'en-US').toLowerCase();
  const primaryLang = cleanLang.split('-')[0];

  // 3. Voices matching target language
  const matchingLangVoices = voices.filter(v => 
    v.lang.toLowerCase() === cleanLang ||
    v.lang.replace('_', '-').toLowerCase() === cleanLang ||
    v.lang.toLowerCase().startsWith(primaryLang)
  );

  if (matchingLangVoices.length > 0) {
    // Priority 3a: Female / natural voice matching target language
    const femaleVoice = matchingLangVoices.find(v => {
      const name = v.name.toLowerCase();
      return name.includes('female') ||
             name.includes('google') ||
             name.includes('natural') ||
             name.includes('jenny') ||
             name.includes('aria') ||
             name.includes('zira') ||
             name.includes('samantha') ||
             name.includes('victoria') ||
             name.includes('karen') ||
             name.includes('denise') ||
             name.includes('celeste');
    });
    if (femaleVoice) return femaleVoice;

    // Priority 3b: Non-male fallback voice in target language
    const nonMaleVoice = matchingLangVoices.find(v => {
      const name = v.name.toLowerCase();
      return !name.includes('male') &&
             !name.includes('david') &&
             !name.includes('mark') &&
             !name.includes('george') &&
             !name.includes('guy');
    });
    if (nonMaleVoice) return nonMaleVoice;

    return matchingLangVoices[0];
  }

  // 4. Global fallback search for natural female voice to preserve ProPlus Nova persona
  const globalFemale = voices.find(v => {
    const name = v.name.toLowerCase();
    return (name.includes('female') || 
            name.includes('google') || 
            name.includes('natural') || 
            name.includes('zira') || 
            name.includes('jenny') ||
            name.includes('samantha')) && 
           v.lang.startsWith('en');
  });
  if (globalFemale) return globalFemale;

  return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
}

/**
 * Clean text for optimal TTS output
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/[\*\_#`~]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/⚠️|🛡️|💜|🚨|🏥|📍|💡|🌸|✨|🌿|📌/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Speaks text using selected language and browser voice with ProPlus Nova persona tuning
 */
export function speakWithLanguage({
  text,
  soundEnabled = true,
  langCode = 'en-US',
  voiceURI = '',
  onStart,
  onEnd,
  onError,
  tune = PROPLUS_NOVA_PROFILE
}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) return null;

  if (soundEnabled) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    // Keep target language code so speech engine uses correct phonetic language rules
    utterance.lang = langCode;
    
    // Apply ProPlus Nova tuning parameters consistently
    const activeTune = tune || PROPLUS_NOVA_PROFILE;
    utterance.pitch = activeTune.pitch;
    utterance.rate = activeTune.rate;
    utterance.volume = activeTune.volume;

    const matchedVoice = getVoiceForLanguage(langCode, voiceURI);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      // Do not overwrite utterance.lang with matchedVoice.lang so that text in target
      // language (e.g. Swahili, French, Spanish) is pronounced correctly with the ProPlus Nova voice persona.
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      if (onError) onError(err);
    };

    window.speechSynthesis.speak(utterance);
    return utterance;
  }

  return null;
}
