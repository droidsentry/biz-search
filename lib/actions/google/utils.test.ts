import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateGoogleCustomSearchParams } from './utils';
import { GoogleCustomSearchPattern } from '@/lib/types/custom-search';

describe('generateGoogleCustomSearchParams', () => {
  // 環境変数のバックアップと設定
  const originalEnv = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
  
  beforeAll(() => {
    process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID = 'test-search-engine-id';
  });

  afterAll(() => {
    if (originalEnv !== undefined) {
      process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID = originalEnv;
    } else {
      delete process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
    }
  });

  // テスト用の基本データ
  const basePattern: GoogleCustomSearchPattern = {
    searchPatternName: 'テストパターン',
    googleCustomSearchParams: {
      customerName: '山田太郎',
      customerNameExactMatch: 'partial',
      address: '',
      addressExactMatch: 'partial',
      dateRestrict: 'all',
      isAdvancedSearchEnabled: false,
      additionalKeywords: [],
      searchSites: [],
      siteSearchMode: 'any',
    },
  };

  describe('基本的な検索クエリ生成', () => {
    it('顧客名のみ（部分一致）で検索クエリを生成する', () => {
      const result = generateGoogleCustomSearchParams(basePattern);
      
      expect(result).toEqual({
        q: '山田太郎',
        cx: 'test-search-engine-id',
        num: 10,
        start: 1,
      });
    });

    it('顧客名のみ（完全一致）で検索クエリを生成する', () => {
      const pattern: GoogleCustomSearchPattern = {
        ...basePattern,
        googleCustomSearchParams: {
          ...basePattern.googleCustomSearchParams,
          customerNameExactMatch: 'exact',
        },
      };
      
      const result = generateGoogleCustomSearchParams(pattern);
      
      expect(result).toEqual({
        q: '"山田太郎"',
        cx: 'test-search-engine-id',
        num: 10,
        start: 1,
      });
    });

    it('顧客名（完全一致）+ 住所（部分一致）で検索クエリを生成する', () => {
      const pattern: GoogleCustomSearchPattern = {
        ...basePattern,
        googleCustomSearchParams: {
          ...basePattern.googleCustomSearchParams,
          customerNameExactMatch: 'exact',
          address: '東京都港区',
          addressExactMatch: 'partial',
        },
      };
      
      const result = generateGoogleCustomSearchParams(pattern);
      
      expect(result).toEqual({
        q: '"山田太郎" 東京都港区',
        cx: 'test-search-engine-id',
        num: 10,
        start: 1,
      });
    });

    it('顧客名（部分一致）+ 住所（完全一致）で検索クエリを生成する', () => {
      const pattern: GoogleCustomSearchPattern = {
        ...basePattern,
        googleCustomSearchParams: {
          ...basePattern.googleCustomSearchParams,
          address: '東京都港区赤坂1-2-3',
          addressExactMatch: 'exact',
        },
      };
      
      const result = generateGoogleCustomSearchParams(pattern);
      
      expect(result).toEqual({
        q: '山田太郎 "東京都港区赤坂1-2-3"',
        cx: 'test-search-engine-id',
        num: 10,
        start: 1,
      });
    });

    it('ページネーション用のstartパラメータを正しく設定する', () => {
      const result = generateGoogleCustomSearchParams(basePattern, 11);
      
      expect(result.start).toBe(11);
    });
  });

  describe('検索期間（dateRestrict）の設定', () => {
    it.each([
      ['y1', 'y1'],
      ['y3', 'y3'],
      ['y5', 'y5'],
      ['y10', 'y10'],
    ])('dateRestrict が %s の場合、パラメータに %s を設定する', (input, expected) => {
      const pattern: GoogleCustomSearchPattern = {
        ...basePattern,
        googleCustomSearchParams: {
          ...basePattern.googleCustomSearchParams,
          dateRestrict: input as 'y1' | 'y3' | 'y5' | 'y10',
        },
      };
      
      const result = generateGoogleCustomSearchParams(pattern);
      
      expect(result.dateRestrict).toBe(expected);
    });

    it('dateRestrict が "all" の場合、パラメータに含めない', () => {
      const pattern: GoogleCustomSearchPattern = {
        ...basePattern,
        googleCustomSearchParams: {
          ...basePattern.googleCustomSearchParams,
          dateRestrict: 'all',
        },
      };
      
      const result = generateGoogleCustomSearchParams(pattern);
      
      expect(result.dateRestrict).toBeUndefined();
    });
  });

  describe('高度な検索オプションがOFFの場合', () => {
    it('追加キーワードが設定されていても無視される', () => {
      const pattern: GoogleCustomSearchPattern = {
        ...basePattern,
        googleCustomSearchParams: {
          ...basePattern.googleCustomSearchParams,
          isAdvancedSearchEnabled: false,
          additionalKeywords: [
            { value: '代表取締役', matchType: 'exact' },
            { value: 'CEO', matchType: 'partial' },
          ],
        },
      };
      
      const result = generateGoogleCustomSearchParams(pattern);
      
      expect(result.orTerms).toBeUndefined();
      expect(result.q).toBe('山田太郎');
    });

    it('サイト検索が設定されていても無視される', () => {
      const pattern: GoogleCustomSearchPattern = {
        ...basePattern,
        googleCustomSearchParams: {
          ...basePattern.googleCustomSearchParams,
          isAdvancedSearchEnabled: false,
          searchSites: ['example.com', 'test.com'],
          siteSearchMode: 'specific',
        },
      };
      
      const result = generateGoogleCustomSearchParams(pattern);
      
      expect(result.siteSearch).toBeUndefined();
      expect(result.siteSearchFilter).toBeUndefined();
      expect(result.q).toBe('山田太郎');
    });
  });

  describe('高度な検索オプションがONの場合', () => {
    describe('追加キーワード（OR検索）', () => {
      it('単一の追加キーワード（完全一致）を処理する', () => {
        const pattern: GoogleCustomSearchPattern = {
          ...basePattern,
          googleCustomSearchParams: {
            ...basePattern.googleCustomSearchParams,
            isAdvancedSearchEnabled: true,
            additionalKeywords: [
              { value: '代表取締役', matchType: 'exact' },
            ],
          },
        };
        
        const result = generateGoogleCustomSearchParams(pattern);
        
        expect(result.orTerms).toBe('"代表取締役"');
      });

      it('複数の追加キーワード（混合）を処理する', () => {
        const pattern: GoogleCustomSearchPattern = {
          ...basePattern,
          googleCustomSearchParams: {
            ...basePattern.googleCustomSearchParams,
            isAdvancedSearchEnabled: true,
            additionalKeywords: [
              { value: '代表取締役', matchType: 'exact' },
              { value: 'CEO', matchType: 'partial' },
              { value: '社長', matchType: 'exact' },
            ],
          },
        };
        
        const result = generateGoogleCustomSearchParams(pattern);
        
        expect(result.orTerms).toBe('"代表取締役"|CEO|"社長"');
      });

      it('空の追加キーワードをフィルタリングする', () => {
        const pattern: GoogleCustomSearchPattern = {
          ...basePattern,
          googleCustomSearchParams: {
            ...basePattern.googleCustomSearchParams,
            isAdvancedSearchEnabled: true,
            additionalKeywords: [
              { value: '', matchType: 'exact' },
              { value: '  ', matchType: 'partial' },
              { value: 'CEO', matchType: 'partial' },
            ],
          },
        };
        
        const result = generateGoogleCustomSearchParams(pattern);
        
        expect(result.orTerms).toBe('CEO');
      });
    });

    describe('サイト検索', () => {
      it('単一サイトの検索（specific）を処理する', () => {
        const pattern: GoogleCustomSearchPattern = {
          ...basePattern,
          googleCustomSearchParams: {
            ...basePattern.googleCustomSearchParams,
            isAdvancedSearchEnabled: true,
            searchSites: ['example.com'],
            siteSearchMode: 'specific',
          },
        };
        
        const result = generateGoogleCustomSearchParams(pattern);
        
        expect(result.siteSearch).toBe('example.com');
        expect(result.siteSearchFilter).toBe('i');
        expect(result.q).toBe('山田太郎');
      });

      it('単一サイトの除外（exclude）を処理する', () => {
        const pattern: GoogleCustomSearchPattern = {
          ...basePattern,
          googleCustomSearchParams: {
            ...basePattern.googleCustomSearchParams,
            isAdvancedSearchEnabled: true,
            searchSites: ['example.com'],
            siteSearchMode: 'exclude',
          },
        };
        
        const result = generateGoogleCustomSearchParams(pattern);
        
        expect(result.siteSearch).toBe('example.com');
        expect(result.siteSearchFilter).toBe('e');
      });

      it('複数サイトの検索（specific）をクエリに追加する', () => {
        const pattern: GoogleCustomSearchPattern = {
          ...basePattern,
          googleCustomSearchParams: {
            ...basePattern.googleCustomSearchParams,
            isAdvancedSearchEnabled: true,
            searchSites: ['example.com', 'test.com', 'sample.jp'],
            siteSearchMode: 'specific',
          },
        };
        
        const result = generateGoogleCustomSearchParams(pattern);
        
        expect(result.q).toBe('山田太郎 (site:example.com OR site:test.com OR site:sample.jp)');
        expect(result.siteSearch).toBeUndefined();
        expect(result.siteSearchFilter).toBeUndefined();
      });

      it('複数サイトの除外（exclude）をクエリに追加する', () => {
        const pattern: GoogleCustomSearchPattern = {
          ...basePattern,
          googleCustomSearchParams: {
            ...basePattern.googleCustomSearchParams,
            isAdvancedSearchEnabled: true,
            searchSites: ['spam.com', 'ad.com'],
            siteSearchMode: 'exclude',
          },
        };
        
        const result = generateGoogleCustomSearchParams(pattern);
        
        expect(result.q).toBe('山田太郎 -site:spam.com -site:ad.com');
      });

      it('siteSearchMode が "any" の場合、サイト検索を追加しない', () => {
        const pattern: GoogleCustomSearchPattern = {
          ...basePattern,
          googleCustomSearchParams: {
            ...basePattern.googleCustomSearchParams,
            isAdvancedSearchEnabled: true,
            searchSites: ['example.com', 'test.com'],
            siteSearchMode: 'any',
          },
        };
        
        const result = generateGoogleCustomSearchParams(pattern);
        
        expect(result.q).toBe('山田太郎');
        expect(result.siteSearch).toBeUndefined();
      });
    });
  });

  describe('エッジケースとクリーンアップ', () => {
    it('住所の前後の空白をトリミングする', () => {
      const pattern: GoogleCustomSearchPattern = {
        ...basePattern,
        googleCustomSearchParams: {
          ...basePattern.googleCustomSearchParams,
          address: '  東京都港区  ',
          addressExactMatch: 'partial',
        },
      };
      
      const result = generateGoogleCustomSearchParams(pattern);
      
      expect(result.q).toBe('山田太郎 東京都港区');
    });

    it('連続するスペースを単一のスペースにクリーンアップする', () => {
      const pattern: GoogleCustomSearchPattern = {
        ...basePattern,
        googleCustomSearchParams: {
          ...basePattern.googleCustomSearchParams,
          customerName: '山田  太郎',
          address: '東京都   港区',
          addressExactMatch: 'partial',
        },
      };
      
      const result = generateGoogleCustomSearchParams(pattern);
      
      expect(result.q).toBe('山田 太郎 東京都 港区');
    });

    it('空のサイトリストを適切に処理する', () => {
      const pattern: GoogleCustomSearchPattern = {
        ...basePattern,
        googleCustomSearchParams: {
          ...basePattern.googleCustomSearchParams,
          isAdvancedSearchEnabled: true,
          searchSites: ['', '  ', 'example.com'],
          siteSearchMode: 'specific',
        },
      };
      
      const result = generateGoogleCustomSearchParams(pattern);
      
      expect(result.siteSearch).toBe('example.com');
      expect(result.siteSearchFilter).toBe('i');
    });

    it('全ての高度な検索オプションを組み合わせて正しく処理する', () => {
      const pattern: GoogleCustomSearchPattern = {
        ...basePattern,
        googleCustomSearchParams: {
          customerName: '株式会社ABC',
          customerNameExactMatch: 'exact',
          address: '東京都千代田区',
          addressExactMatch: 'partial',
          dateRestrict: 'y1',
          isAdvancedSearchEnabled: true,
          additionalKeywords: [
            { value: '代表取締役', matchType: 'exact' },
            { value: 'CEO', matchType: 'partial' },
          ],
          searchSites: ['linkedin.com', 'facebook.com'],
          siteSearchMode: 'specific',
        },
      };
      
      const result = generateGoogleCustomSearchParams(pattern);
      
      expect(result).toEqual({
        q: '"株式会社ABC" 東京都千代田区 (site:linkedin.com OR site:facebook.com)',
        cx: 'test-search-engine-id',
        num: 10,
        start: 1,
        dateRestrict: 'y1',
        orTerms: '"代表取締役"|CEO',
      });
    });
  });

  describe('実際のユースケース', () => {
    it('高橋さんの検索パターン（高度な検索OFF）を正しく処理する', () => {
      const pattern: GoogleCustomSearchPattern = {
        searchPatternName: '新規検索パターン',
        searchPatternDescription: '',
        googleCustomSearchParams: {
          customerName: '高橋',
          customerNameExactMatch: 'exact',
          address: '',
          addressExactMatch: 'partial',
          dateRestrict: 'all',
          isAdvancedSearchEnabled: false,
          additionalKeywords: [
            { value: 'キーワード1', matchType: 'exact' },
            { value: 'キーワード2', matchType: 'partial' },
            { value: 'キーワード3', matchType: 'exact' },
          ],
          searchSites: ['facebook.com', 'linkedin.com', 'nikkei.com'],
          siteSearchMode: 'any',
        },
      };
      
      const result = generateGoogleCustomSearchParams(pattern);
      
      // isAdvancedSearchEnabled が false なので、追加キーワードとサイト検索は無視される
      expect(result).toEqual({
        q: '"高橋"',
        cx: 'test-search-engine-id',
        num: 10,
        start: 1,
      });
      
      // 明示的に確認
      expect(result.orTerms).toBeUndefined();
      expect(result.siteSearch).toBeUndefined();
      expect(result.siteSearchFilter).toBeUndefined();
      expect(result.dateRestrict).toBeUndefined(); // 'all' なので含まれない
    });

    it('同じデータで高度な検索をONにした場合の処理を確認する', () => {
      const pattern: GoogleCustomSearchPattern = {
        searchPatternName: '新規検索パターン',
        searchPatternDescription: '',
        googleCustomSearchParams: {
          customerName: '高橋',
          customerNameExactMatch: 'exact',
          address: '',
          addressExactMatch: 'partial',
          dateRestrict: 'all',
          isAdvancedSearchEnabled: true, // ONに変更
          additionalKeywords: [
            { value: '社長', matchType: 'exact' },
            { value: '代表', matchType: 'partial' },
            { value: 'CEO', matchType: 'exact' },
          ],
          searchSites: ['facebook.com', 'linkedin.com', 'nikkei.com'],
          siteSearchMode: 'any',
        },
      };
      
      const result = generateGoogleCustomSearchParams(pattern);
      
      // isAdvancedSearchEnabled が true でも、siteSearchMode が 'any' なのでサイト検索は適用されない
      expect(result).toEqual({
        q: '"高橋"',
        cx: 'test-search-engine-id',
        num: 10,
        start: 1,
        orTerms: '"社長"|代表|"CEO"', // 追加キーワードは適用される
      });
      
      // サイト検索は適用されないことを明示的に確認
      expect(result.siteSearch).toBeUndefined();
      expect(result.siteSearchFilter).toBeUndefined();
    });

    it('高橋さんの検索に住所を追加した場合を処理する', () => {
      const pattern: GoogleCustomSearchPattern = {
        searchPatternName: '新規検索パターン',
        googleCustomSearchParams: {
          customerName: '高橋',
          customerNameExactMatch: 'exact',
          address: '東京都新宿区',
          addressExactMatch: 'partial',
          dateRestrict: 'y3',
          isAdvancedSearchEnabled: true,
          additionalKeywords: [
            { value: '社長', matchType: 'exact' },
          ],
          searchSites: ['facebook.com', 'linkedin.com'],
          siteSearchMode: 'specific', // 特定サイトでの検索
        },
      };
      
      const result = generateGoogleCustomSearchParams(pattern);
      
      expect(result).toEqual({
        q: '"高橋" 東京都新宿区 (site:facebook.com OR site:linkedin.com)',
        cx: 'test-search-engine-id',
        num: 10,
        start: 1,
        dateRestrict: 'y3',
        orTerms: '"社長"',
      });
    });
  });
});