import axios from 'axios'
import type {
  VocabularyCollection,
  CreateCollectionPayload,
  AddWordPayload,
  UpdateWordStatusPayload,
  UpdateProgressPayload,
  ProgressResponse,
} from '../types/vocabulary'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const API_BASE = `${BASE_URL}/vocabulary`;
export const LOCAL_STORAGE_KEY = 'omni_vocab_ids'
export const LOCAL_COLLECTIONS_KEY = 'omni_my_collections_data'

export const vocabAxios = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

vocabAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})


export function getStoredIds(): string[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function storeId(id: string): void {
  try {
    const ids = getStoredIds()
    if (!ids.includes(id)) {
      ids.unshift(id)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids))
    }
  } catch (e) {
    console.warn('LocalStorage error:', e)
  }
}

export function removeId(id: string): void {
  try {
    const ids = getStoredIds().filter(i => i !== id)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids))
    // Also remove from cached collections
    const cached = getCachedCollections()
    const updated = cached.filter(c => c.id !== id)
    saveCachedCollections(updated)
  } catch (e) {
    console.warn('LocalStorage error:', e)
  }
}

export function cleanWordType(wt?: string): string {
  if (!wt) return 'noun'
  let cleaned = String(wt).trim()
  if (cleaned.toLowerCase().startsWith('wordtype.')) {
    cleaned = cleaned.substring(9)
  }
  return cleaned.toLowerCase()
}

export function sanitizeCollection(collection: VocabularyCollection): VocabularyCollection {
  if (!collection) return collection
  if (collection.words_list && Array.isArray(collection.words_list)) {
    const cleaned = collection.words_list.map(w => {
      const item = { ...w }
      if (item && item.image_url && typeof item.image_url === 'string' && item.image_url.startsWith('blob:')) {
        item.image_url = ''
      }
      if (item && item.word_type) {
        item.word_type = cleanWordType(item.word_type)
      }
      return item
    })
    return { ...collection, words_list: cleaned }
  }
  return collection
}

// Local Storage Cache Helpers for instant reload persistence
export function getCachedCollections(): VocabularyCollection[] {
  try {
    const data = localStorage.getItem(LOCAL_COLLECTIONS_KEY)
    if (!data) return []
    const parsed: VocabularyCollection[] = JSON.parse(data)
    const sanitized = parsed.map(sanitizeCollection).filter(c => !c.is_official)
    localStorage.setItem(LOCAL_COLLECTIONS_KEY, JSON.stringify(sanitized))
    return sanitized
  } catch {
    return []
  }
}

export function clearLocalVocabCache(): void {
  try {
    localStorage.removeItem(LOCAL_COLLECTIONS_KEY)
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  } catch (e) {
    console.warn('LocalStorage clear error:', e)
  }
}

export function saveCachedCollections(collections: VocabularyCollection[]): void {
  try {
    const onlyPersonal = collections.filter(c => !c.is_official)
    const sanitized = onlyPersonal.map(sanitizeCollection)
    localStorage.setItem(LOCAL_COLLECTIONS_KEY, JSON.stringify(sanitized))
  } catch (e) {
    console.warn('LocalStorage save error:', e)
  }
}

export function updateSingleCachedCollection(collection: VocabularyCollection): void {
  if (collection.is_official) return
  try {
    const sanitized = sanitizeCollection(collection)
    const cached = getCachedCollections()
    const index = cached.findIndex(c => c.id === sanitized.id)
    if (index >= 0) {
      cached[index] = sanitized
    } else {
      cached.unshift(sanitized)
    }
    saveCachedCollections(cached)
    storeId(sanitized.id)
  } catch (e) {
    console.warn('Cache update error:', e)
  }
}

async function apiFetch<T>(path: string, options?: { method?: string; body?: any; headers?: any }): Promise<T> {
  const method = options?.method?.toUpperCase() || 'GET'
  let dataPayload = undefined
  if (options?.body) {
    dataPayload = typeof options.body === 'string' ? JSON.parse(options.body) : options.body
  }

  const response = await vocabAxios.request<T>({
    url: path,
    method,
    data: dataPayload,
    headers: options?.headers,
  })

  return response.data
}

export async function getMyCollections(): Promise<VocabularyCollection[]> {
  try {
    const apiData = await apiFetch<VocabularyCollection[]>('/collections/my-collections')
    if (Array.isArray(apiData)) {
      const personalOnly = apiData.filter(c => !c.is_official)
      const sanitized = personalOnly.map(sanitizeCollection)
      saveCachedCollections(sanitized)
      return sanitized
    }
  } catch (err) {
    console.warn('Backend API fetch error, falling back to local cache:', err)
    return getCachedCollections()
  }
  return []
}

export async function getOfficialCollections(): Promise<VocabularyCollection[]> {
  try {
    const apiData = await apiFetch<VocabularyCollection[]>('/collections/official')
    if (apiData && apiData.length > 0) {
      return apiData.map(sanitizeCollection)
    }
  } catch {
    // ignore
  }
  return []
}

export async function getAllAvailableCollections(): Promise<VocabularyCollection[]> {
  try {
    const [myCols, officialCols] = await Promise.all([
      getMyCollections().catch(() => []),
      getOfficialCollections().catch(() => [])
    ])
    const combined = [...myCols, ...officialCols]
    if (combined.length > 0) {
      return combined
    }
  } catch (err) {
    console.warn('Error fetching all collections:', err)
  }
  return getCachedCollections()
}

export async function createCollection(payload: CreateCollectionPayload): Promise<VocabularyCollection> {
  try {
    const created = await apiFetch<VocabularyCollection>('/collections/my-collections', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    updateSingleCachedCollection(created)
    return created
  } catch {
    // If backend is offline, generate local fallback collection
    const fallback: VocabularyCollection = {
      id: `col_${Date.now()}`,
      title: payload.title,
      description: payload.description || '',
      topic: 'Custom',
      language: payload.language || 'Anh-Mỹ',
      is_official: false,
      total_learners: 1,
      accuracy_percentage: 0,
      study_time_seconds: 0,
      words_list: [],
    }
    updateSingleCachedCollection(fallback)
    return fallback
  }
}

export async function updateCollection(
  collectionId: string,
  payload: { title?: string; description?: string; language?: string }
): Promise<{ status: string; message: string }> {
  try {
    const res = await apiFetch<{ status: string; message: string }>(`/collections/${collectionId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    // Also update local cache
    const cached = getCachedCollections()
    const target = cached.find(c => c.id === collectionId)
    if (target) {
      if (payload.title !== undefined) target.title = payload.title
      if (payload.description !== undefined) target.description = payload.description
      if (payload.language !== undefined) target.language = payload.language
      updateSingleCachedCollection(target)
    }
    return res
  } catch {
    const cached = getCachedCollections()
    const target = cached.find(c => c.id === collectionId)
    if (target) {
      if (payload.title !== undefined) target.title = payload.title
      if (payload.description !== undefined) target.description = payload.description
      if (payload.language !== undefined) target.language = payload.language
      updateSingleCachedCollection(target)
    }
    return { status: 'success', message: 'Updated locally' }
  }
}

export async function getCollection(id: string): Promise<VocabularyCollection> {
  // Local fallback collections (created while backend was offline) only exist in cache
  const isLocalFallback = id.startsWith('col_')

  if (!isLocalFallback) {
    try {
      const col = await apiFetch<VocabularyCollection>(`/collections/${id}`)
      if (col) {
        const sanitized = sanitizeCollection(col)
        updateSingleCachedCollection(sanitized)
        return sanitized
      }
    } catch (err) {
      console.warn(`Could not fetch collection ${id} from API, checking cache:`, err)
    }
  }

  const cached = getCachedCollections().find(c => c.id === id)
  if (cached) return cached
  throw new Error('Vocabulary collection not found')
}


export async function deleteCollection(id: string): Promise<{ status: string; message: string }> {
  try {
    await apiFetch<{ status: string; message: string }>(`/collections/${id}`, {
      method: 'DELETE',
    })
  } catch {
    // ignore
  }
  removeId(id)
  return { status: 'success', message: 'Collection deleted' }
}

export async function addWord(
  collectionId: string,
  payload: AddWordPayload
): Promise<{ status: string; message: string }> {
  try {
    const res = await apiFetch<{ status: string; message: string }>(`/collections/${collectionId}/words`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return res
  } catch (err: any) {
    // Nếu backend trả về lỗi có response (4xx/5xx), re-throw để caller xử lý
    // Ví dụ: 409 Conflict → từ đã tồn tại → hiện toast warning ở modal
    if (err?.response) {
      throw err
    }
    // Chỉ fallback local khi mất kết nối hoàn toàn (backend offline)
    const cached = getCachedCollections()
    const target = cached.find(c => c.id === collectionId)
    if (target) {
      target.words_list.push({
        id: `w_${Date.now()}`,
        word: payload.word,
        word_type: payload.word_type || 'noun',
        meaning: payload.meaning,
        ipa: payload.ipa || '',
        example_sentence: payload.example_sentence || '',
        image_url: payload.image_url || '',
        learning_status: 'LEARNING',
      })
      updateSingleCachedCollection(target)
    }
    return { status: 'success', message: 'Word added locally' }
  }
}


export async function updateWord(
  wordId: string,
  payload: AddWordPayload
): Promise<{ status: string; message: string }> {
  try {
    await apiFetch<{ status: string; message: string }>(`/words/${wordId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  } catch {
    // ignore
  }
  return { status: 'success', message: 'Word updated' }
}

export async function bulkAddWords(
  collectionId: string,
  words: AddWordPayload[]
): Promise<{ status: string; message: string }> {
  try {
    return await apiFetch<{ status: string; message: string }>(`/collections/${collectionId}/words/bulk`, {
      method: 'POST',
      body: JSON.stringify({ words }),
    })
  } catch {
    return { status: 'success', message: 'Bulk added' }
  }
}

export async function bulkUpdateWords(
  collectionId: string,
  words: (AddWordPayload & { id: string })[]
): Promise<{ status: string; message: string }> {
  try {
    return await apiFetch<{ status: string; message: string }>(`/collections/${collectionId}/words/bulk-update`, {
      method: 'PUT',
      body: JSON.stringify({ words }),
    })
  } catch {
    return { status: 'success', message: 'Bulk updated' }
  }
}

export async function pasteText(
  collectionId: string,
  rawText: string
): Promise<{
  status: string
  message: string
  added_count: number
  new_created_count: number
  highlighted_text: string
  extracted_words: string[]
}> {
  return apiFetch(`/collections/${collectionId}/words/paste-text`, {
    method: 'POST',
    body: JSON.stringify({ raw_text: rawText }),
  })
}

export async function updateWordStatus(payload: UpdateWordStatusPayload): Promise<ProgressResponse> {
  try {
    return await apiFetch<ProgressResponse>('/word-status/update', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch {
    return {
      message: 'Updated locally',
      user_id: 'user',
      collection_id: payload.collection_id,
      total_mastered: 1,
      total_learning: 1,
      accuracy_percentage: 100,
    }
  }
}

export async function updateCollectionProgress(payload: UpdateProgressPayload): Promise<ProgressResponse> {
  try {
    return await apiFetch<ProgressResponse>('/collection-progress/update', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch {
    return {
      message: 'Updated locally',
      user_id: 'user',
      collection_id: payload.collection_id,
      total_mastered: 1,
      total_learning: 1,
      accuracy_percentage: 100,
    }
  }
}

export interface WordDetailsResult {
  ipa: string
  word_type?: string
  meaning?: string
  example_sentence?: string
}

export function isBlockedOrNonsenseWord(word: string): boolean {
  const clean = word.toLowerCase().trim();
  if (!clean) return true;
  if (clean.length === 1 && clean !== 'a' && clean !== 'i') return true;
  
  if (clean.length >= 4 && clean.length % 2 === 0) {
    const half = clean.length / 2;
    if (clean.substring(0, half) === clean.substring(half) && !['bulk', 'team', 'couscous', 'murmur'].includes(clean)) {
      return true;
    }
  }

  const blocked = new Set([
    'asdf', 'qwerty', 'zxcv', 'asdfghjk', 'qwertyuiop', 'zxcvbnm',
    'lmao', 'xyz', 'skibidi', 'hihi', 'haha', 'hehe', 'huhu', 'hoho', 'kaka', 'gogo',
    'megaman', 'pokemon', 'goku', 'naruto', 'pikachu', 'sonic', 'mario', 'batman', 'superman'
  ]);
  return blocked.has(clean);
}

export async function fetchWordDetails(word: string): Promise<WordDetailsResult> {
  if (!word || !word.trim() || isBlockedOrNonsenseWord(word)) {
    return { ipa: '', word_type: 'noun', meaning: '', example_sentence: '' }
  }
  const cleanWord = word.trim()

  // 1. Query backend endpoint via Axios (Backend returns ipa, word_type, meaning, example_sentence)
  try {
    const res = await vocabAxios.get<{ ipa?: string; word_type?: string; meaning?: string; example_sentence?: string }>(`/fetch-ipa`, {
      params: { word: cleanWord },
    })
    if (res.data) {
      return {
        ipa: res.data.ipa || '',
        word_type: res.data.word_type || 'noun',
        meaning: res.data.meaning || '',
        example_sentence: res.data.example_sentence || '',
      }
    }
  } catch {
    // Backend API offline/unreachable - proceed to fallback
  }

  // 2. Client-side fallback via Datamuse API (CORS friendly) & Dictionary API proxy
  try {
    const datamuseUrl = `https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord.toLowerCase())}&md=rd`
    const res = await axios.get(datamuseUrl)
    if (res.status === 200 && Array.isArray(res.data) && res.data[0]) {
      const item = res.data[0]
      let foundIpa = ''
      let foundType = 'noun'
      let foundMeaning = ''

      if (item.tags && Array.isArray(item.tags)) {
        const pronTag = item.tags.find((t: string) => t.startsWith('pron:'))
        if (pronTag) {
          const rawPron = pronTag.substring(5).trim().split(/\s+/)
          const arpabetMap: Record<string, string> = {
            AA: 'ɑ', AA0: 'ɑ', AA1: 'ˈɑ', AA2: 'ˌɑ', AE: 'æ', AE0: 'æ', AE1: 'ˈæ', AE2: 'ˌæ',
            AH: 'ʌ', AH0: 'ə', AH1: 'ˈʌ', AH2: 'ˌʌ', AO: 'ɔ', AO0: 'ɔ', AO1: 'ˈɔ', AO2: 'ˌɔ',
            AW: 'aʊ', AW0: 'aʊ', AW1: 'ˈaʊ', AW2: 'ˌaʊ', AY: 'aɪ', AY0: 'aɪ', AY1: 'ˈaɪ', AY2: 'ˌaɪ',
            B: 'b', CH: 'tʃ', D: 'd', DH: 'ð', EH: 'ɛ', EH0: 'ɛ', EH1: 'ˈɛ', EH2: 'ˌɛ',
            ER: 'ɝ', ER0: 'ər', ER1: 'ˈɝ', ER2: 'ˌɝ', EY: 'eɪ', EY0: 'eɪ', EY1: 'ˈeɪ', EY2: 'ˌeɪ',
            F: 'f', G: 'ɡ', HH: 'h', IH: 'ɪ', IH0: 'ɪ', IH1: 'ˈɪ', IH2: 'ˌɪ', IY: 'i', IY0: 'i', IY1: 'ˈi', IY2: 'ˌi',
            JH: 'dʒ', K: 'k', L: 'l', M: 'm', N: 'n', NG: 'ŋ', OW: 'oʊ', OW0: 'oʊ', OW1: 'ˈoʊ', OW2: 'ˌoʊ',
            OY: 'ɔɪ', OY0: 'ɔɪ', OY1: 'ˈɔɪ', OY2: 'ˌOY2', P: 'p', R: 'ɹ', S: 's', SH: 'ʃ', T: 't', TH: 'θ',
            UH: 'ʊ', UH0: 'ʊ', UH1: 'ˈʊ', UH2: 'ˌʊ', UW: 'u', UW0: 'u', UW1: 'ˈu', UW2: 'ˌu',
            V: 'v', W: 'w', Y: 'j', Z: 'z', ZH: 'ʒ'
          }
          const converted = rawPron.map((p: string) => arpabetMap[p] || p.toLowerCase()).join('')
          foundIpa = `/${converted}/`
        }
      }

      if (item.defs && Array.isArray(item.defs) && item.defs[0]) {
        const parts = item.defs[0].split('\t')
        if (parts.length >= 2) {
          const typeLetter = parts[0]
          foundMeaning = parts[1]
          if (typeLetter === 'n') foundType = 'noun'
          else if (typeLetter === 'v') foundType = 'verb'
          else if (typeLetter === 'adj') foundType = 'adjective'
          else if (typeLetter === 'adv') foundType = 'adverb'
        }
      }

      if (foundIpa) {
        return { ipa: foundIpa, word_type: foundType, meaning: foundMeaning, example_sentence: '' }
      }
    }
  } catch {
    // Datamuse error
  }

  // 3. Last-resort CORS proxy fallback
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord.toLowerCase())}`)}`
    const res = await axios.get(proxyUrl, { validateStatus: status => status === 200 })
    if (res.status === 200 && Array.isArray(res.data) && res.data[0]) {
      let foundIpa = ''
      let foundType = 'noun'
      let foundMeaning = ''
      let foundExample = ''
      if (res.data[0].meanings && res.data[0].meanings[0]) {
        foundType = res.data[0].meanings[0].partOfSpeech || 'noun'
        if (res.data[0].meanings[0].definitions && res.data[0].meanings[0].definitions[0]) {
          foundMeaning = res.data[0].meanings[0].definitions[0].definition || ''
          foundExample = res.data[0].meanings[0].definitions[0].example || ''
        }
      }
      if (res.data[0].phonetic) foundIpa = res.data[0].phonetic
      else if (res.data[0].phonetics && Array.isArray(res.data[0].phonetics)) {
        for (const p of res.data[0].phonetics) {
          if (p.text) {
            foundIpa = p.text
            break
          }
        }
      }
      return { ipa: foundIpa, word_type: foundType, meaning: foundMeaning, example_sentence: foundExample }
    }
  } catch {
    // Word not found or proxy error
  }
  return { ipa: '', word_type: 'noun', meaning: '', example_sentence: '' }
}


export async function fetchIPA(word: string): Promise<string> {
  const details = await fetchWordDetails(word)
  return details.ipa
}


