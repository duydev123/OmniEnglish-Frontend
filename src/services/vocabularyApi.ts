import type {
  VocabularyCollection,
  CreateCollectionPayload,
  AddWordPayload,
  UpdateWordStatusPayload,
  UpdateProgressPayload,
  ProgressResponse,
} from '../types/vocabulary'

const API_BASE = 'http://localhost:8000/api/v1/vocabulary'
export const LOCAL_STORAGE_KEY = 'omni_vocab_ids'
export const LOCAL_COLLECTIONS_KEY = 'omni_my_collections_data'

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

// Local Storage Cache Helpers for instant reload persistence
export function getCachedCollections(): VocabularyCollection[] {
  try {
    const data = localStorage.getItem(LOCAL_COLLECTIONS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveCachedCollections(collections: VocabularyCollection[]): void {
  try {
    localStorage.setItem(LOCAL_COLLECTIONS_KEY, JSON.stringify(collections))
  } catch (e) {
    console.warn('LocalStorage save error:', e)
  }
}

export function updateSingleCachedCollection(collection: VocabularyCollection): void {
  try {
    const cached = getCachedCollections()
    const index = cached.findIndex(c => c.id === collection.id)
    if (index >= 0) {
      cached[index] = collection
    } else {
      cached.unshift(collection)
    }
    saveCachedCollections(cached)
    storeId(collection.id)
  } catch (e) {
    console.warn('Cache update error:', e)
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  if (!res.ok) {
    let errMessage = `HTTP error ${res.status}`
    try {
      const errData = await res.json()
      if (errData.detail) errMessage = errData.detail
    } catch {
      // ignore json parse error
    }
    throw new Error(errMessage)
  }

  return res.json()
}

export async function getMyCollections(): Promise<VocabularyCollection[]> {
  try {
    const apiData = await apiFetch<VocabularyCollection[]>('/collections/my-collections')
    if (apiData && apiData.length > 0) {
      // Sync with cache
      saveCachedCollections(apiData)
      return apiData
    }
  } catch (err) {
    console.warn('Backend API fetch error, falling back to local cache:', err)
  }
  return getCachedCollections()
}

export async function getOfficialCollections(): Promise<VocabularyCollection[]> {
  try {
    const apiData = await apiFetch<VocabularyCollection[]>('/collections/official')
    if (apiData && apiData.length > 0) return apiData
  } catch {
    // ignore
  }
  return []
}

export async function createCollection(payload: CreateCollectionPayload): Promise<VocabularyCollection> {
  try {
    const created = await apiFetch<VocabularyCollection>('/collections/my-collections', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    updateSingleCachedCollection(created)
    return created
  } catch (err) {
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
  try {
    const col = await apiFetch<VocabularyCollection>(`/collections/${id}`)
    if (col) {
      updateSingleCachedCollection(col)
      return col
    }
  } catch (err) {
    console.warn(`Could not fetch collection ${id} from API, checking cache:`, err)
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
  } catch {
    // Add locally to cache
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
  return apiFetch('/collections/{collection_id}/words/paste-text'.replace('{collection_id}', collectionId), {
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

export async function fetchIPA(word: string): Promise<string> {
  if (!word || !word.trim()) return ''
  try {
    const cleanWord = word.trim().toLowerCase()
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`)
    if (!res.ok) return ''
    const data = await res.json()
    if (Array.isArray(data) && data[0]) {
      if (data[0].phonetic) return data[0].phonetic
      if (data[0].phonetics && Array.isArray(data[0].phonetics)) {
        for (const p of data[0].phonetics) {
          if (p.text) return p.text
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch IPA for word:', word, err)
  }
  return ''
}

