import { SerpstackResponse } from '@/lib/serpstack'

export function getDummySerpstackData(query: string, page: number = 1): SerpstackResponse {
  const itemsPerPage = 10
  const startIndex = (page - 1) * itemsPerPage
  
  // 35件のダミーデータ
  const allResults = [
    {
      position: 1,
      title: "株式会社山田商事 - 会社概要",
      url: "https://yamada-shoji.co.jp/company",
      domain: "yamada-shoji.co.jp",
      displayed_url: "https://yamada-shoji.co.jp › company",
      snippet: "株式会社山田商事は、1985年創業の総合商社です。本社は東京都港区に位置し、国内外に幅広いネットワークを展開しています。"
    },
    {
      position: 2,
      title: "有限会社佐藤工業 | 建設・土木工事",
      url: "https://sato-kogyo.jp",
      domain: "sato-kogyo.jp",
      displayed_url: "https://sato-kogyo.jp",
      snippet: "大阪府を中心に建設・土木工事を手がける有限会社佐藤工業。地域密着型の施工で、安心・安全な建築物をご提供します。"
    },
    {
      position: 3,
      title: "田中不動産株式会社 - 不動産売買・賃貸",
      url: "https://tanaka-fudosan.com",
      domain: "tanaka-fudosan.com",
      displayed_url: "https://tanaka-fudosan.com",
      snippet: "名古屋市を拠点とする田中不動産。マンション・アパート・戸建ての売買、賃貸管理を専門に行っています。創業30年の実績。"
    },
    {
      position: 4,
      title: "鈴木製作所 - 精密機械部品製造",
      url: "https://suzuki-seisakusho.co.jp/about",
      domain: "suzuki-seisakusho.co.jp",
      displayed_url: "https://suzuki-seisakusho.co.jp › about",
      snippet: "精密機械部品の設計・製造を行う鈴木製作所。ISO9001認証取得。自動車部品から医療機器部品まで幅広く対応。"
    },
    {
      position: 5,
      title: "株式会社高橋電気 | 電気工事・設備",
      url: "https://takahashi-denki.jp",
      domain: "takahashi-denki.jp",
      displayed_url: "https://takahashi-denki.jp",
      snippet: "福岡県で電気工事・電気設備工事を行う株式会社高橋電気。住宅からビル・工場まで、あらゆる電気工事に対応いたします。"
    },
    {
      position: 6,
      title: "渡辺物流センター - 倉庫・運送サービス",
      url: "https://watanabe-logistics.com/service",
      domain: "watanabe-logistics.com",
      displayed_url: "https://watanabe-logistics.com › service",
      snippet: "関東エリアを中心に倉庫保管・配送サービスを提供。24時間365日対応可能な物流ソリューションをご提案します。"
    },
    {
      position: 7,
      title: "伊藤建設株式会社 - 総合建設業",
      url: "https://ito-kensetsu.co.jp",
      domain: "ito-kensetsu.co.jp",
      displayed_url: "https://ito-kensetsu.co.jp",
      snippet: "住宅建築からビル建設まで手がける総合建設会社。耐震・省エネ設計で安心の住まいづくりをサポートします。"
    },
    {
      position: 8,
      title: "中村食品工業 | 食品製造・加工",
      url: "https://nakamura-foods.jp/company",
      domain: "nakamura-foods.jp",
      displayed_url: "https://nakamura-foods.jp › company",
      snippet: "冷凍食品・レトルト食品の製造を行う中村食品工業。HACCP認証取得工場で、安全・安心な食品をお届けします。"
    },
    {
      position: 9,
      title: "小林運輸株式会社 - 貨物運送",
      url: "https://kobayashi-unyu.com",
      domain: "kobayashi-unyu.com",
      displayed_url: "https://kobayashi-unyu.com",
      snippet: "全国ネットワークで貨物輸送サービスを展開。トラック輸送から海上コンテナ輸送まで、物流のトータルサポート。"
    },
    {
      position: 10,
      title: "山本商店 - 卸売・小売業",
      url: "https://yamamoto-shoten.jp/about",
      domain: "yamamoto-shoten.jp",
      displayed_url: "https://yamamoto-shoten.jp › about",
      snippet: "生活雑貨・日用品の卸売を中心に事業展開。地域に根ざした商いで、お客様のニーズにお応えします。"
    },
    {
      position: 11,
      title: "加藤産業株式会社 | 化学製品製造",
      url: "https://kato-sangyo.co.jp",
      domain: "kato-sangyo.co.jp",
      displayed_url: "https://kato-sangyo.co.jp",
      snippet: "工業用化学製品の製造・販売を行う加藤産業。環境に配慮した製品開発で、持続可能な社会づくりに貢献します。"
    },
    {
      position: 12,
      title: "吉田エンジニアリング - 機械設計",
      url: "https://yoshida-eng.com/services",
      domain: "yoshida-eng.com",
      displayed_url: "https://yoshida-eng.com › services",
      snippet: "産業機械の設計・開発を専門とする技術集団。3D CADを活用した精密設計で、お客様のニーズを形にします。"
    },
    {
      position: 13,
      title: "斎藤印刷株式会社 - 印刷・製本",
      url: "https://saito-printing.jp",
      domain: "saito-printing.jp",
      displayed_url: "https://saito-printing.jp",
      snippet: "オフセット印刷からデジタル印刷まで、あらゆる印刷ニーズに対応。企画・デザインから製本まで一貫生産。"
    },
    {
      position: 14,
      title: "株式会社松本建材 | 建築資材販売",
      url: "https://matsumoto-kenzai.co.jp/products",
      domain: "matsumoto-kenzai.co.jp",
      displayed_url: "https://matsumoto-kenzai.co.jp › products",
      snippet: "建築資材の専門商社として、木材・鋼材・セメントなど幅広い商品を取り扱い。迅速な配送でお客様をサポート。"
    },
    {
      position: 15,
      title: "井上ファーム - 農業生産法人",
      url: "https://inoue-farm.jp",
      domain: "inoue-farm.jp",
      displayed_url: "https://inoue-farm.jp",
      snippet: "有機栽培にこだわった野菜・果物の生産を行う井上ファーム。安全で美味しい農産物を全国にお届けします。"
    },
    {
      position: 16,
      title: "清水技研株式会社 - 精密加工",
      url: "https://shimizu-giken.com/technology",
      domain: "shimizu-giken.com",
      displayed_url: "https://shimizu-giken.com › technology",
      snippet: "NC旋盤・マシニングセンタによる精密加工。試作から量産まで、高品質な部品加工サービスを提供します。"
    },
    {
      position: 17,
      title: "木村自動車整備工場 | 車検・修理",
      url: "https://kimura-auto.jp",
      domain: "kimura-auto.jp",
      displayed_url: "https://kimura-auto.jp",
      snippet: "国産車から輸入車まで、あらゆるメーカーの車検・整備・修理に対応。地域密着で40年の実績があります。"
    },
    {
      position: 18,
      title: "林業協同組合 - 森林管理・木材販売",
      url: "https://ringyo-coop.or.jp/about",
      domain: "ringyo-coop.or.jp",
      displayed_url: "https://ringyo-coop.or.jp › about",
      snippet: "持続可能な森林経営を目指す林業協同組合。間伐材の有効活用や森林保全活動を通じて、環境保護に貢献。"
    },
    {
      position: 19,
      title: "村田水産加工 - 水産物加工・販売",
      url: "https://murata-suisan.com",
      domain: "murata-suisan.com",
      displayed_url: "https://murata-suisan.com",
      snippet: "新鮮な魚介類の加工・販売を行う村田水産。独自の急速冷凍技術で、鮮度を保ったまま全国へお届けします。"
    },
    {
      position: 20,
      title: "藤田プラスチック工業 | 樹脂成形",
      url: "https://fujita-plastic.co.jp/factory",
      domain: "fujita-plastic.co.jp",
      displayed_url: "https://fujita-plastic.co.jp › factory",
      snippet: "射出成形による樹脂製品の製造。自動車部品から家電部品まで、高精度な成形技術でお客様のニーズに応えます。"
    },
    {
      position: 21,
      title: "岡田電子部品株式会社 - 電子部品商社",
      url: "https://okada-denshi.jp",
      domain: "okada-denshi.jp",
      displayed_url: "https://okada-denshi.jp",
      snippet: "半導体・電子部品の専門商社。国内外の優良メーカー製品を取り扱い、迅速な納品体制を整えています。"
    },
    {
      position: 22,
      title: "森田クリーニング - クリーニングサービス",
      url: "https://morita-cleaning.com/service",
      domain: "morita-cleaning.com",
      displayed_url: "https://morita-cleaning.com › service",
      snippet: "衣類から布団まで、あらゆるクリーニングに対応。最新設備と熟練の技術で、大切な品物を美しく仕上げます。"
    },
    {
      position: 23,
      title: "新井測量設計事務所 | 測量・設計",
      url: "https://arai-survey.co.jp",
      domain: "arai-survey.co.jp",
      displayed_url: "https://arai-survey.co.jp",
      snippet: "土地測量から建築設計まで、総合的な技術サービスを提供。最新の測量機器とCADシステムで正確な成果を納品。"
    },
    {
      position: 24,
      title: "長谷川畳店 - 畳製造・販売",
      url: "https://hasegawa-tatami.jp/products",
      domain: "hasegawa-tatami.jp",
      displayed_url: "https://hasegawa-tatami.jp › products",
      snippet: "伝統的な畳から現代的な畳まで、幅広いニーズに対応。熟練の職人が一枚一枚丁寧に仕上げます。"
    },
    {
      position: 25,
      title: "大西リサイクルセンター | 資源回収",
      url: "https://onishi-recycle.com",
      domain: "onishi-recycle.com",
      displayed_url: "https://onishi-recycle.com",
      snippet: "金属・紙・プラスチックなどの資源回収・リサイクル。環境保護と資源の有効活用に貢献する企業です。"
    },
    {
      position: 26,
      title: "株式会社石川造園 - 造園・外構工事",
      url: "https://ishikawa-zouen.co.jp/works",
      domain: "ishikawa-zouen.co.jp",
      displayed_url: "https://ishikawa-zouen.co.jp › works",
      snippet: "庭園設計から外構工事まで、緑のある豊かな空間づくりをサポート。伝統技術と現代センスを融合した施工。"
    },
    {
      position: 27,
      title: "橋本医療器械 - 医療機器販売",
      url: "https://hashimoto-medical.jp",
      domain: "hashimoto-medical.jp",
      displayed_url: "https://hashimoto-medical.jp",
      snippet: "医療機器・医療材料の専門商社。最新の医療機器から消耗品まで、医療現場のニーズに幅広く対応します。"
    },
    {
      position: 28,
      title: "関西物産株式会社 | 食品卸売",
      url: "https://kansai-bussan.com/company",
      domain: "kansai-bussan.com",
      displayed_url: "https://kansai-bussan.com › company",
      snippet: "業務用食材の卸売を中心に事業展開。レストラン・ホテル・給食施設など、外食産業をトータルサポート。"
    },
    {
      position: 29,
      title: "平野鉄工所 - 鉄骨加工・施工",
      url: "https://hirano-tekko.co.jp",
      domain: "hirano-tekko.co.jp",
      displayed_url: "https://hirano-tekko.co.jp",
      snippet: "鉄骨構造物の設計・製作・施工を一貫して行う平野鉄工所。確かな技術力で安全な構造物を提供します。"
    },
    {
      position: 30,
      title: "株式会社安田商会 - 包装資材販売",
      url: "https://yasuda-shokai.jp/products",
      domain: "yasuda-shokai.jp",
      displayed_url: "https://yasuda-shokai.jp › products",
      snippet: "段ボール・包装資材の専門商社。オーダーメイドの包装設計から既製品まで、幅広い商品ラインナップ。"
    },
    {
      position: 31,
      title: "野村ソフトウェア開発 | システム開発",
      url: "https://nomura-soft.com",
      domain: "nomura-soft.com",
      displayed_url: "https://nomura-soft.com",
      snippet: "業務システムの開発からWebアプリケーション構築まで、ITソリューションをワンストップで提供します。"
    },
    {
      position: 32,
      title: "千葉繊維工業 - 繊維製品製造",
      url: "https://chiba-textile.co.jp/factory",
      domain: "chiba-textile.co.jp",
      displayed_url: "https://chiba-textile.co.jp › factory",
      snippet: "産業用繊維から衣料用生地まで、多様な繊維製品を製造。最新設備と伝統技術で高品質な製品を生産。"
    },
    {
      position: 33,
      title: "東日本エネルギー株式会社 - 燃料販売",
      url: "https://eastnihon-energy.jp",
      domain: "eastnihon-energy.jp",
      displayed_url: "https://eastnihon-energy.jp",
      snippet: "ガソリン・軽油・灯油などの石油製品販売。給油所運営から配送サービスまで、エネルギー供給を支えます。"
    },
    {
      position: 34,
      title: "南海工務店 - リフォーム・修繕",
      url: "https://nankai-koumuten.com/reform",
      domain: "nankai-koumuten.com",
      displayed_url: "https://nankai-koumuten.com › reform",
      snippet: "住宅リフォームから店舗改装まで、あらゆる修繕・改装工事に対応。お客様の理想を形にします。"
    },
    {
      position: 35,
      title: "株式会社北陸商事 | 総合商社",
      url: "https://hokuriku-shoji.co.jp",
      domain: "hokuriku-shoji.co.jp",
      displayed_url: "https://hokuriku-shoji.co.jp",
      snippet: "北陸地方を基盤とする総合商社。地域の発展と共に成長し、多様な商品・サービスを提供しています。"
    }
  ]

  // ページングに応じて結果を返す
  const paginatedResults = allResults.slice(startIndex, startIndex + itemsPerPage)
  const totalPages = Math.ceil(allResults.length / itemsPerPage)

  return {
    request: {
      success: true,
      processed_timestamp: Date.now(),
      search_url: `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${startIndex}`,
      total_time_taken: 0.5 + Math.random() * 0.5
    },
    search_parameters: {
      engine: "google",
      type: "web",
      device: "desktop",
      query: query,
      location: "Tokyo, Japan",
      google_domain: "google.co.jp",
      gl: "jp",
      hl: "ja",
      safe: 0,
      page: page,
      num: itemsPerPage,
      output: "json"
    },
    search_information: {
      query: query,
      total_results: allResults.length,
      time_taken_displayed: 0.3 + Math.random() * 0.2
    },
    organic_results: paginatedResults.map((result, index) => ({
      ...result,
      position: startIndex + index + 1
    })),
    pagination: {
      current: page,
      ...(page < totalPages && { next: `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${(page) * itemsPerPage}` }),
      pages: Array.from({ length: totalPages }, (_, i) => ({
        page: i + 1,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${i * itemsPerPage}`
      }))
    }
  }
}