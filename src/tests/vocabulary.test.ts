import axios from 'axios'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCachedCollections,
  saveCachedCollections,
  updateSingleCachedCollection,
  sanitizeCollection,
  fetchIPA,
  getStoredIds,
  storeId,
  removeId,
  vocabAxios,
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
          },
          {
            id: 'w2',
            word: 'banana',
            word_type: 'noun',
            meaning: 'quả chuối',
            ipa: '/bəˈnæn.ə/',
            image_url: 'https://images.unsplash.com/photo-1571771894821',
          },
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
})
