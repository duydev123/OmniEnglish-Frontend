import axios from 'axios'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCachedCollections,
  saveCachedCollections,
  updateSingleCachedCollection,
  sanitizeCollection,
  cleanWordType,
  fetchIPA,
  getStoredIds,
  storeId,
  removeId,
  vocabAxios,
  getCollection,
} from '../services/vocabularyApi'
import { speakText, getLangCode } from '../utils/tts'
import type { VocabularyCollection } from '../types/vocabulary'

describe('Vocabulary Frontend Services & Utils', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('LocalStorage Caching & Persistence', () => {
    it('should return an empty array when cache is empty', () => {
      const collections = getCachedCollections()
      expect(collections).toEqual([])
    })

    it('should save and retrieve cached collections correctly', () => {
      const sampleCollection: VocabularyCollection = {
        id: 'col_1',
        title: 'IELTS Academic',
        description: 'Core words',
        topic: 'IELTS',
        language: 'Anh-Mỹ',
        is_official: false,
        total_learners: 10,
        accuracy_percentage: 85,
        study_time_seconds: 1200,
        words_list: [],
      }

      saveCachedCollections([sampleCollection])
      const retrieved = getCachedCollections()
      expect(retrieved).toHaveLength(1)
      expect(retrieved[0].title).toBe('IELTS Academic')
    })

    it('should update or insert a single collection in cache', () => {
      const col: VocabularyCollection = {
        id: 'col_2',
        title: 'TOEIC Essential',
        description: 'Business words',
        topic: 'TOEIC',
        language: 'Anh-Mỹ',
        is_official: false,
        total_learners: 5,
        accuracy_percentage: 90,
        study_time_seconds: 600,
        words_list: [],
      }

      updateSingleCachedCollection(col)
      const ids = getStoredIds()
      expect(ids).toContain('col_2')

      const cached = getCachedCollections()
      expect(cached.some((c) => c.id === 'col_2')).toBe(true)
    })
  })

  describe('ID Storage Management', () => {
    it('should manage stored IDs in localStorage', () => {
      storeId('test_id_1')
      storeId('test_id_2')

      let ids = getStoredIds()
      expect(ids).toEqual(['test_id_2', 'test_id_1'])

      removeId('test_id_1')
      ids = getStoredIds()
      expect(ids).toEqual(['test_id_2'])
    })
  })

  describe('Collection Blob Sanitize Helper', () => {
    it('should strip expired blob: URLs from words', () => {
      const rawCollection: VocabularyCollection = {
        id: 'col_3',
        title: 'Blob Test',
        description: 'Testing blob removal',
        topic: 'General',
        language: 'Anh-Mỹ',
        is_official: false,
        total_learners: 1,
        accuracy_percentage: 100,
        study_time_seconds: 0,
        words_list: [
          {
            id: 'w1',
            word: 'apple',
            word_type: 'noun',
            meaning: 'quả táo',
            ipa: '/ˈæp.əl/',
            image_url: 'blob:http://localhost:5173/0696799c-a865-4914',
          } as any,
          {
            id: 'w2',
            word: 'banana',
            word_type: 'noun',
            meaning: 'quả chuối',
            ipa: '/bəˈnæn.ə/',
            image_url: 'https://images.unsplash.com/photo-1571771894821',
          } as any,
        ],
      }

      const sanitized = sanitizeCollection(rawCollection)
      expect(sanitized.words_list[0].image_url).toBe('')
      expect(sanitized.words_list[1].image_url).toBe(
        'https://images.unsplash.com/photo-1571771894821'
      )
    })
  })

  describe('IPA Auto-Fetch Service', () => {
    it('should return fetched IPA from backend endpoint', async () => {
      const mockIPA = '/ˌser.ənˈdɪp.ə.ti/'
      vi.spyOn(vocabAxios, 'get').mockResolvedValue({
        data: { ipa: mockIPA },
        status: 200,
      } as any)

      const ipa = await fetchIPA('serendipity')
      expect(ipa).toBe(mockIPA)
    })

    it('should return empty string fallback if backend fetch fails', async () => {
      vi.spyOn(vocabAxios, 'get').mockRejectedValue(new Error('Network error'))
      vi.spyOn(axios, 'get').mockRejectedValue(new Error('Network error'))

      const ipa = await fetchIPA('unknownwordxyz')
      expect(ipa).toBe('')
    })
  })


  describe('Text-To-Speech (TTS) Utils', () => {
    it('should correctly map language titles to BCP 47 language codes', () => {
      expect(getLangCode('Anh-Mỹ')).toBe('en-US')
      expect(getLangCode('Anh-Anh')).toBe('en-GB')
      expect(getLangCode('American English')).toBe('en-US')
      expect(getLangCode('British English')).toBe('en-GB')
      expect(getLangCode('')).toBe('en-US')
    })

    it('should attempt speech synthesis with selected voice accent', () => {
      const mockSpeak = vi.fn()
      const mockCancel = vi.fn()

      const mockSpeechSynthesis = {
        speak: mockSpeak,
        cancel: mockCancel,
        getVoices: () => [
          { name: 'Google US English', lang: 'en-US' },
          { name: 'Google UK English Female', lang: 'en-GB' },
        ],
      }

      vi.stubGlobal('speechSynthesis', mockSpeechSynthesis)
      vi.stubGlobal('SpeechSynthesisUtterance', class MockSpeechSynthesisUtterance {
        lang = ''
        rate = 1
        voice = null
        text = ''
        constructor(text: string) {
          this.text = text
        }
      })

      speakText('serendipity', 'Anh-Mỹ', 1.0)
      expect(mockCancel).toHaveBeenCalled()
      expect(mockSpeak).toHaveBeenCalled()
    })
  })

  describe('getCollection - Local Fallback ID Bypass', () => {

    it('should return cached collection without calling API for col_ prefixed IDs', async () => {
      // Regression: col_ IDs are local-only fallbacks; calling the backend always 404s
      const localCol: VocabularyCollection = {
        id: 'col_1786079810413',
        title: 'Offline Collection',
        description: '',
        topic: 'Custom',
        language: 'Anh-Mỹ',
        is_official: false,
        total_learners: 1,
        accuracy_percentage: 0,
        study_time_seconds: 0,
        words_list: [],
      }
      updateSingleCachedCollection(localCol)

      const apiSpy = vi.spyOn(vocabAxios, 'get')
      const result = await getCollection('col_1786079810413')

      expect(apiSpy).not.toHaveBeenCalled()
      expect(result.id).toBe('col_1786079810413')
      expect(result.title).toBe('Offline Collection')
    })

    it('should throw when col_ ID is not found in cache', async () => {
      await expect(getCollection('col_not_in_cache_xyz')).rejects.toThrow(
        'Vocabulary collection not found'
      )
    })
  })

  describe('sanitizeCollection - Edge Cases', () => {
    it('should handle empty words_list without crashing', () => {
      const col: VocabularyCollection = {
        id: 'col_empty',
        title: 'Empty',
        description: '',
        topic: 'General',
        language: 'Anh-Mỹ',
        is_official: false,
        total_learners: 0,
        accuracy_percentage: 0,
        study_time_seconds: 0,
        words_list: [],
      }
      const result = sanitizeCollection(col)
      expect(result.words_list).toEqual([])
    })

    it('should preserve non-blob and empty image_url values untouched', () => {
      const col: VocabularyCollection = {
        id: 'col_img',
        title: 'Image Test',
        description: '',
        topic: 'General',
        language: 'Anh-Mỹ',
        is_official: false,
        total_learners: 0,
        accuracy_percentage: 0,
        study_time_seconds: 0,
        words_list: [
          { id: 'w1', word: 'cat', word_type: 'noun', meaning: 'con mèo', ipa: '', image_url: '' } as any,
          {
            id: 'w2',
            word: 'dog',
            word_type: 'noun',
            meaning: 'con chó',
            ipa: '',
            image_url: 'https://cdn.example.com/dog.png',
          } as any,
        ],
      }
      const result = sanitizeCollection(col)
      expect(result.words_list[0].image_url).toBe('')
      expect(result.words_list[1].image_url).toBe('https://cdn.example.com/dog.png')
    })
  })

  describe('storeId - Idempotency', () => {
    it('should not create duplicate entries when storing the same ID twice', () => {
      storeId('dup_id_99')
      storeId('dup_id_99')
      const ids = getStoredIds()
      const count = ids.filter((id) => id === 'dup_id_99').length
      expect(count).toBe(1)
    })
  })

  describe('getLangCode - Unknown Input', () => {
    it('should return en-US fallback for completely unknown language string', () => {
      expect(getLangCode('Unknown Language XYZ')).toBe('en-US')
    })
  })

  describe('fetchIPA - Whitespace Input', () => {
    it('should return empty string for whitespace-only word without calling API', async () => {
      const apiSpy = vi.spyOn(vocabAxios, 'get')
      const ipa = await fetchIPA('   ')
      expect(ipa).toBe('')
      expect(apiSpy).not.toHaveBeenCalled()
    })
  })

  describe('WordType Sanitization & Cleaning Helpers', () => {
    it('should clean legacy WordType. enum prefixes to lowercase strings', () => {
      expect(cleanWordType('WordType.NOUN')).toBe('noun')
      expect(cleanWordType('WORDTYPE.VERB')).toBe('verb')
      expect(cleanWordType('  WordType.ADJECTIVE  ')).toBe('adjective')
      expect(cleanWordType('idiom')).toBe('idiom')
      expect(cleanWordType('')).toBe('noun')
      expect(cleanWordType(undefined)).toBe('noun')
    })

    it('should sanitize word_type across words_list in a collection', () => {
      const colWithEnumTypes: VocabularyCollection = {
        id: 'col_enum_test',
        title: 'Enum Sanitize Test',
        description: '',
        topic: 'General',
        language: 'Anh-Mỹ',
        is_official: false,
        total_learners: 0,
        accuracy_percentage: 0,
        study_time_seconds: 0,
        words_list: [
          { id: 'w1', word: 'apple', word_type: 'WordType.NOUN', meaning: 'táo', ipa: '' } as any,
          { id: 'w2', word: 'run', word_type: 'WORDTYPE.VERB', meaning: 'chạy', ipa: '' } as any,
        ],
      }
      const sanitized = sanitizeCollection(colWithEnumTypes)
      expect(sanitized.words_list[0].word_type).toBe('noun')
      expect(sanitized.words_list[1].word_type).toBe('verb')
    })
  })
})
