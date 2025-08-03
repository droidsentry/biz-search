import z from "zod";
import { keywordsSchema } from "../schemas/serpapi";
import { getSearchPatterns } from "@/app/(main)/search/execute/components/action";

export const serpapiResponse = {
  "search_metadata": {
    "id": "688a43d7a89e0249c1e76d04",
    "status": "Success",
    "json_endpoint": "https://serpapi.com/searches/9ccbf491729c09b5/688a43d7a89e0249c1e76d04.json",
    "pixel_position_endpoint": "https://serpapi.com/searches/9ccbf491729c09b5/688a43d7a89e0249c1e76d04.json_with_pixel_position",
    "created_at": "2025-07-30 16:09:59 UTC",
    "processed_at": "2025-07-30 16:09:59 UTC",
    "google_url": "https://www.google.com/search?q=%E2%80%9D%E7%86%8A%E8%B0%B7%E5%B9%B4%E6%99%83%E2%80%9D&oq=%E2%80%9D%E7%86%8A%E8%B0%B7%E5%B9%B4%E6%99%83%E2%80%9D&uule=w+CAIQICILVG9reW8sSmFwYW4&hl=ja&gl=jp&sourceid=chrome&ie=UTF-8",
    "raw_html_file": "https://serpapi.com/searches/9ccbf491729c09b5/688a43d7a89e0249c1e76d04.html",
    "total_time_taken": 1.13
  },
  "search_parameters": {
    "engine": "google",
    "q": "”熊谷年晃”",
    "location_requested": "Tokyo, Japan",
    "location_used": "Tokyo,Japan",
    "google_domain": "google.com",
    "hl": "ja",
    "gl": "jp",
    "device": "desktop"
  },
  "search_information": {
    "query_displayed": "”熊谷年晃”",
    "total_results": 140,
    "time_taken_displayed": 0.22,
    "organic_results_state": "Results for exact spelling",
    "results_for": "埼玉県熊谷市"
  },
  "organic_results": [
    {
      "position": 1,
      "title": "会社概要",
      "link": "https://www.scc-corp.co.jp/about",
      "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.scc-corp.co.jp/about&ved=2ahUKEwif2eGN_OSOAxV6s1YBHbr9IhkQFnoECAoQAQ",
      "displayed_link": "https://www.scc-corp.co.jp › about",
      "favicon": "https://serpapi.com/searches/688a43d7a89e0249c1e76d04/images/1095521aa2c7aa9902f50272623417e49b2f1433cb6e17cda7a40b3243a2fb49.png",
      "snippet": "商号: 株式会社サンサークル ; 代表者: 代表取締役社長 熊谷 年晃 ; 資本金: 1,000万円（授権資本 4,000万） ; 法人成立: 昭和47年4月 ; 事業場: 静岡県浜松市中央区東若林町32 ...",
      "snippet_highlighted_words": [
        "熊谷 年晃"
      ],
      "source": "株式会社サンサークル"
    },
    {
      "position": 2,
      "title": "株式会社サンサークル 役員名：熊谷年晃/鈴木智章/松井洋/楓 ...",
      "link": "https://yellowpage.usonar.co.jp/companies/2570d26aa52b6e7b5d069962928253be",
      "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://yellowpage.usonar.co.jp/companies/2570d26aa52b6e7b5d069962928253be&ved=2ahUKEwif2eGN_OSOAxV6s1YBHbr9IhkQFnoECBoQAQ",
      "displayed_link": "https://yellowpage.usonar.co.jp › companies",
      "favicon": "https://serpapi.com/searches/688a43d7a89e0249c1e76d04/images/1095521aa2c7aa9902f50272623417e4a7791430f9a3101531927768dbd15001.png",
      "snippet": "熊谷 年晃. 役員, 熊谷年晃（代表取締役）/鈴木 智章（取締役）松井 洋（取締役）/楓力考（監査役）. 登記簿. 株式会社サンサークルの登記簿を業界最安値で取得可能です ...",
      "snippet_highlighted_words": [
        "熊谷 年晃",
        "熊谷年晃"
      ],
      "source": "イエローページ"
    },
    {
      "position": 3,
      "title": "株式会社サンサークル の企業情報",
      "link": "https://www.buffett-code.com/company/973p4tbtlc/",
      "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.buffett-code.com/company/973p4tbtlc/&ved=2ahUKEwif2eGN_OSOAxV6s1YBHbr9IhkQFnoECBgQAQ",
      "displayed_link": "https://www.buffett-code.com › company",
      "favicon": "https://serpapi.com/searches/688a43d7a89e0249c1e76d04/images/1095521aa2c7aa9902f50272623417e497eebbe03391b7651c040b8b3a515951.png",
      "snippet": "代表取締役社長 熊谷 年晃. 資本金, 10,000,000円. 住所, 静岡県浜松市中央区東若林町32番地の38. 会社HP, http://www.scc-corp.co.jp/. 機関設計①, N/A. 機関設計②, N/A.",
      "snippet_highlighted_words": [
        "熊谷 年晃"
      ],
      "source": "バフェット・コード"
    },
    {
      "position": 4,
      "title": "サンサークル - 入社理由と入社後ギャップ",
      "link": "https://www.openwork.jp/company_answer.php?m_id=a0C10000011UV8M&q_no=3",
      "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.openwork.jp/company_answer.php%3Fm_id%3Da0C10000011UV8M%26q_no%3D3&ved=2ahUKEwif2eGN_OSOAxV6s1YBHbr9IhkQFnoECBkQAQ",
      "displayed_link": "https://www.openwork.jp › ... › 入社理由とギャップ",
      "favicon": "https://serpapi.com/searches/688a43d7a89e0249c1e76d04/images/1095521aa2c7aa9902f50272623417e49e79d6c65c2dc67ab6d578bd2e641fe0.png",
      "snippet": "静岡県浜松市中央区東若林町32-38 · 30〜99人 · 1972年 · 代表取締役社長 熊谷 年晃 ...",
      "snippet_highlighted_words": [
        "熊谷 年晃"
      ],
      "source": "OpenWork"
    },
    {
      "position": 5,
      "title": "熊谷年晃",
      "link": "https://relocation-personnel.com/?s=%E7%86%8A%E8%B0%B7%E5%B9%B4%E6%99%83",
      "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://relocation-personnel.com/%3Fs%3D%25E7%2586%258A%25E8%25B0%25B7%25E5%25B9%25B4%25E6%2599%2583&ved=2ahUKEwif2eGN_OSOAxV6s1YBHbr9IhkQFnoECCgQAQ",
      "displayed_link": "https://relocation-personnel.com › s=熊谷年晃",
      "snippet": "(2015年12月01日) 生産調査（藤沢工場長） 技術統括部長、 シート事業部長、 ボデー機能部品技術本部副本部長、 ドア外装部品技術本部主査、",
      "source": "人事異動ニュース"
    },
    {
      "position": 6,
      "title": "サンサークルのSDGs評判・レビュー一覧【SDGs クチコミ Lodge】",
      "link": "https://sdgs-kuchikomi-lodge.jp/enterprises/40510",
      "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://sdgs-kuchikomi-lodge.jp/enterprises/40510&ved=2ahUKEwif2eGN_OSOAxV6s1YBHbr9IhkQFnoECCQQAQ",
      "displayed_link": "https://sdgs-kuchikomi-lodge.jp › enterprises",
      "favicon": "https://serpapi.com/searches/688a43d7a89e0249c1e76d04/images/1095521aa2c7aa9902f50272623417e4b860f974ea6bcd10fb8443f5a70352d9.png",
      "snippet": "所在地. 静岡県浜松市中央区東若林町32番地の38. 電話番号. -. 代表者名. 熊谷 年晃. 設立. -. 関連企業・団体. 関連企業・団体はありません.",
      "snippet_highlighted_words": [
        "熊谷 年晃"
      ],
      "source": "SDGs クチコミ Lodge"
    },
    {
      "position": 7,
      "title": "株式会社サンサークルの転職・企業概要",
      "link": "https://doda.jp/DodaFront/View/Company/j_id__10012378267/",
      "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://doda.jp/DodaFront/View/Company/j_id__10012378267/&ved=2ahUKEwif2eGN_OSOAxV6s1YBHbr9IhkQFnoECCEQAQ",
      "displayed_link": "https://doda.jp › View › Company › j_id__10012378267",
      "favicon": "https://serpapi.com/searches/688a43d7a89e0249c1e76d04/images/1095521aa2c7aa9902f50272623417e4cf5767c5f2a01e55154416b42a6d534f.png",
      "snippet": "所在地. 静岡県浜松市中央区東若林町32-38. 設立. 1972年 04月. 代表者. 代表取締役 熊谷 年晃. 資本金. 10 百万円. 出典：ユーソナー株式会社 ...",
      "snippet_highlighted_words": [
        "熊谷 年晃"
      ],
      "source": "doda"
    },
    {
      "position": 8,
      "title": "株式会社サンサークル - 年収・給与制度",
      "link": "https://www.openwork.jp/company_answer.php?m_id=a0C10000011UV8M&q_no=2",
      "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.openwork.jp/company_answer.php%3Fm_id%3Da0C10000011UV8M%26q_no%3D2&ved=2ahUKEwif2eGN_OSOAxV6s1YBHbr9IhkQFnoECDIQAQ",
      "displayed_link": "https://www.openwork.jp › ... › 年収・給与制度",
      "favicon": "https://serpapi.com/searches/688a43d7a89e0249c1e76d04/images/1095521aa2c7aa9902f50272623417e4c2589e432106d6c4d558ba83c3ed91c0.png",
      "snippet": "1972年. 代表者, 代表取締役社長 熊谷 年晃. 企業情報を修正する. 同業界の企業. 株式会社杉浦製作所. 杉浦製作所のロゴ. 3.17. 社員クチコミ: 59件; 求人: 0件. 比較する ...",
      "snippet_highlighted_words": [
        "熊谷 年晃"
      ],
      "source": "OpenWork"
    },
    {
      "position": 9,
      "title": "レッグレスト機構 | 特許情報",
      "link": "https://jglobal.jst.go.jp/detail?JGLOBAL_ID=201403013196961763",
      "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://jglobal.jst.go.jp/detail%3FJGLOBAL_ID%3D201403013196961763&ved=2ahUKEwif2eGN_OSOAxV6s1YBHbr9IhkQFnoECC8QAQ",
      "displayed_link": "https://jglobal.jst.go.jp › detail",
      "favicon": "https://serpapi.com/searches/688a43d7a89e0249c1e76d04/images/1095521aa2c7aa9902f50272623417e4af01c1d279420e6642f128b603e956fe.png",
      "snippet": "杉浦 歳機. 杉浦 歳機 について ; 熊谷 年晃. 熊谷 年晃 について ; 斉藤 正紀. 斉藤 正紀 について ; 中島 智晴. 中島 智晴 について ; シロキ工業株式会社. シロキ工業株式 ...",
      "snippet_highlighted_words": [
        "熊谷 年晃",
        "熊谷 年晃"
      ],
      "source": "J-Global"
    },
    {
      "position": 10,
      "title": "株式会社サンサークルの求人・転職情報",
      "link": "https://www.hatalike.jp/viewjob/a46135816b73c360/",
      "redirect_link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.hatalike.jp/viewjob/a46135816b73c360/&ved=2ahUKEwif2eGN_OSOAxV6s1YBHbr9IhkQFnoECCwQAQ",
      "displayed_link": "https://www.hatalike.jp › viewjob",
      "favicon": "https://serpapi.com/searches/688a43d7a89e0249c1e76d04/images/1095521aa2c7aa9902f50272623417e492e1d45de395dc8782ff3798aa112f74.png",
      "snippet": "会社名. 株式会社サンサークル ; 代表者. 熊谷 年晃 ; 所在住所. 静岡県浜松市中央区東若林町32-38 ; お問い合わせ先. 0534538317 ; 事業内容. 製造・メーカー ...",
      "snippet_highlighted_words": [
        "熊谷 年晃"
      ],
      "source": "はたらいく"
    }
  ],
  "pagination": {
    "current": 1,
    "next": "https://www.google.com/search?q=%E2%80%9D%E7%86%8A%E8%B0%B7%E5%B9%B4%E6%99%83%E2%80%9D&sca_esv=c311fd178b8510f8&gl=jp&hl=ja&ei=2EOKaJ-NB_rm2roPuvuLyQE&start=10&sa=N&sstk=Ac65TH5WI5Trj1tnOeWJ2Zsyd6Q-MUUvYQ5TM4r05Z32plrO5eAOS_FoKYNa7QtvZYePOuv4vlHnWGSJMywLr-OISUDkjQ0PvjG79Q&ved=2ahUKEwif2eGN_OSOAxV6s1YBHbr9IhkQ8NMDegQIKxAM",
    "other_pages": {
      "2": "https://www.google.com/search?q=%E2%80%9D%E7%86%8A%E8%B0%B7%E5%B9%B4%E6%99%83%E2%80%9D&sca_esv=c311fd178b8510f8&gl=jp&hl=ja&ei=2EOKaJ-NB_rm2roPuvuLyQE&start=10&sa=N&sstk=Ac65TH5WI5Trj1tnOeWJ2Zsyd6Q-MUUvYQ5TM4r05Z32plrO5eAOS_FoKYNa7QtvZYePOuv4vlHnWGSJMywLr-OISUDkjQ0PvjG79Q&ved=2ahUKEwif2eGN_OSOAxV6s1YBHbr9IhkQ8tMDegQIKxAE",
      "3": "https://www.google.com/search?q=%E2%80%9D%E7%86%8A%E8%B0%B7%E5%B9%B4%E6%99%83%E2%80%9D&sca_esv=c311fd178b8510f8&gl=jp&hl=ja&ei=2EOKaJ-NB_rm2roPuvuLyQE&start=20&sa=N&sstk=Ac65TH5WI5Trj1tnOeWJ2Zsyd6Q-MUUvYQ5TM4r05Z32plrO5eAOS_FoKYNa7QtvZYePOuv4vlHnWGSJMywLr-OISUDkjQ0PvjG79Q&ved=2ahUKEwif2eGN_OSOAxV6s1YBHbr9IhkQ8tMDegQIKxAG",
      "4": "https://www.google.com/search?q=%E2%80%9D%E7%86%8A%E8%B0%B7%E5%B9%B4%E6%99%83%E2%80%9D&sca_esv=c311fd178b8510f8&gl=jp&hl=ja&ei=2EOKaJ-NB_rm2roPuvuLyQE&start=30&sa=N&sstk=Ac65TH5WI5Trj1tnOeWJ2Zsyd6Q-MUUvYQ5TM4r05Z32plrO5eAOS_FoKYNa7QtvZYePOuv4vlHnWGSJMywLr-OISUDkjQ0PvjG79Q&ved=2ahUKEwif2eGN_OSOAxV6s1YBHbr9IhkQ8tMDegQIKxAI",
      "5": "https://www.google.com/search?q=%E2%80%9D%E7%86%8A%E8%B0%B7%E5%B9%B4%E6%99%83%E2%80%9D&sca_esv=c311fd178b8510f8&gl=jp&hl=ja&ei=2EOKaJ-NB_rm2roPuvuLyQE&start=40&sa=N&sstk=Ac65TH5WI5Trj1tnOeWJ2Zsyd6Q-MUUvYQ5TM4r05Z32plrO5eAOS_FoKYNa7QtvZYePOuv4vlHnWGSJMywLr-OISUDkjQ0PvjG79Q&ved=2ahUKEwif2eGN_OSOAxV6s1YBHbr9IhkQ8tMDegQIKxAK"
    }
  },
  "serpapi_pagination": {
    "current": 1,
    "next_link": "https://serpapi.com/search.json?device=desktop&engine=google&gl=jp&google_domain=google.com&hl=ja&location=Tokyo%2C+Japan&q=%E2%80%9D%E7%86%8A%E8%B0%B7%E5%B9%B4%E6%99%83%E2%80%9D&start=10",
    "next": "https://serpapi.com/search.json?device=desktop&engine=google&gl=jp&google_domain=google.com&hl=ja&location=Tokyo%2C+Japan&q=%E2%80%9D%E7%86%8A%E8%B0%B7%E5%B9%B4%E6%99%83%E2%80%9D&start=10",
    "other_pages": {
      "2": "https://serpapi.com/search.json?device=desktop&engine=google&gl=jp&google_domain=google.com&hl=ja&location=Tokyo%2C+Japan&q=%E2%80%9D%E7%86%8A%E8%B0%B7%E5%B9%B4%E6%99%83%E2%80%9D&start=10",
      "3": "https://serpapi.com/search.json?device=desktop&engine=google&gl=jp&google_domain=google.com&hl=ja&location=Tokyo%2C+Japan&q=%E2%80%9D%E7%86%8A%E8%B0%B7%E5%B9%B4%E6%99%83%E2%80%9D&start=20",
      "4": "https://serpapi.com/search.json?device=desktop&engine=google&gl=jp&google_domain=google.com&hl=ja&location=Tokyo%2C+Japan&q=%E2%80%9D%E7%86%8A%E8%B0%B7%E5%B9%B4%E6%99%83%E2%80%9D&start=30",
      "5": "https://serpapi.com/search.json?device=desktop&engine=google&gl=jp&google_domain=google.com&hl=ja&location=Tokyo%2C+Japan&q=%E2%80%9D%E7%86%8A%E8%B0%B7%E5%B9%B4%E6%99%83%E2%80%9D&start=40"
    }
  }
}
export type SerpapiResponse = typeof serpapiResponse;

export type Keywords = z.infer<typeof keywordsSchema>;


export type SearchPattern = Awaited<
  ReturnType<typeof getSearchPatterns>
>[number];