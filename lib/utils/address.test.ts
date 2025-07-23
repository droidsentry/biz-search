import { describe, expect, test } from 'vitest';
import { formatAddressToCityLevel } from './address';

describe('formatAddressToCityLevel', () => {
  // 47都道府県すべてのテストケース
  describe('47都道府県の住所', () => {
    test('北海道・東北地方', () => {
      expect(formatAddressToCityLevel('北海道札幌市中央区北1条西2丁目')).toBe('北海道札幌市中央区');
      expect(formatAddressToCityLevel('北海道函館市五稜郭町1-1')).toBe('北海道函館市');
      expect(formatAddressToCityLevel('青森県青森市新町1-3-7')).toBe('青森県青森市');
      expect(formatAddressToCityLevel('岩手県盛岡市内丸10-1')).toBe('岩手県盛岡市');
      expect(formatAddressToCityLevel('宮城県仙台市青葉区国分町3-7-1')).toBe('宮城県仙台市青葉区');
      expect(formatAddressToCityLevel('秋田県秋田市山王1-1-1')).toBe('秋田県秋田市');
      expect(formatAddressToCityLevel('山形県山形市松波2-8-1')).toBe('山形県山形市');
      expect(formatAddressToCityLevel('福島県福島市五老内町3-1')).toBe('福島県福島市');
    });

    test('関東地方', () => {
      expect(formatAddressToCityLevel('茨城県水戸市笠原町978-6')).toBe('茨城県水戸市');
      expect(formatAddressToCityLevel('栃木県宇都宮市塙田1-1-20')).toBe('栃木県宇都宮市');
      expect(formatAddressToCityLevel('群馬県前橋市大手町1-1-1')).toBe('群馬県前橋市');
      expect(formatAddressToCityLevel('埼玉県さいたま市浦和区高砂3-15-1')).toBe('埼玉県さいたま市浦和区');
      expect(formatAddressToCityLevel('千葉県千葉市中央区市場町1-1')).toBe('千葉県千葉市中央区');
      expect(formatAddressToCityLevel('東京都新宿区西新宿2-8-1')).toBe('東京都新宿区');
      expect(formatAddressToCityLevel('神奈川県横浜市中区日本大通1')).toBe('神奈川県横浜市中区');
    });

    test('中部地方', () => {
      expect(formatAddressToCityLevel('新潟県新潟市中央区新光町4-1')).toBe('新潟県新潟市中央区');
      expect(formatAddressToCityLevel('富山県富山市新総曲輪1-7')).toBe('富山県富山市');
      expect(formatAddressToCityLevel('石川県金沢市鞍月1-1')).toBe('石川県金沢市');
      expect(formatAddressToCityLevel('福井県福井市大手3-17-1')).toBe('福井県福井市');
      expect(formatAddressToCityLevel('山梨県甲府市丸の内1-6-1')).toBe('山梨県甲府市');
      expect(formatAddressToCityLevel('長野県長野市大字南長野字幅下692-2')).toBe('長野県長野市');
      expect(formatAddressToCityLevel('岐阜県岐阜市薮田南2-1-1')).toBe('岐阜県岐阜市');
      expect(formatAddressToCityLevel('静岡県静岡市葵区追手町9-6')).toBe('静岡県静岡市葵区');
      expect(formatAddressToCityLevel('愛知県名古屋市中区三の丸3-1-2')).toBe('愛知県名古屋市中区');
    });

    test('近畿地方', () => {
      expect(formatAddressToCityLevel('三重県津市広明町13')).toBe('三重県津市');
      expect(formatAddressToCityLevel('滋賀県大津市京町4-1-1')).toBe('滋賀県大津市');
      expect(formatAddressToCityLevel('京都府京都市上京区下立売通新町西入薮ノ内町')).toBe('京都府京都市上京区');
      expect(formatAddressToCityLevel('大阪府大阪市中央区大手前2')).toBe('大阪府大阪市中央区');
      expect(formatAddressToCityLevel('兵庫県神戸市中央区下山手通5-10-1')).toBe('兵庫県神戸市中央区');
      expect(formatAddressToCityLevel('奈良県奈良市登大路町30')).toBe('奈良県奈良市');
      expect(formatAddressToCityLevel('和歌山県和歌山市小松原通1-1')).toBe('和歌山県和歌山市');
    });

    test('中国地方', () => {
      expect(formatAddressToCityLevel('鳥取県鳥取市東町1-220')).toBe('鳥取県鳥取市');
      expect(formatAddressToCityLevel('島根県松江市殿町1')).toBe('島根県松江市');
      expect(formatAddressToCityLevel('岡山県岡山市北区内山下2-4-6')).toBe('岡山県岡山市北区');
      expect(formatAddressToCityLevel('広島県広島市中区基町10-52')).toBe('広島県広島市中区');
      expect(formatAddressToCityLevel('山口県山口市滝町1-1')).toBe('山口県山口市');
    });

    test('四国地方', () => {
      expect(formatAddressToCityLevel('徳島県徳島市万代町1-1')).toBe('徳島県徳島市');
      expect(formatAddressToCityLevel('香川県高松市番町4-1-10')).toBe('香川県高松市');
      expect(formatAddressToCityLevel('愛媛県松山市一番町4-4-2')).toBe('愛媛県松山市');
      expect(formatAddressToCityLevel('高知県高知市丸ノ内1-2-20')).toBe('高知県高知市');
    });

    test('九州・沖縄地方', () => {
      expect(formatAddressToCityLevel('福岡県福岡市博多区東公園7-7')).toBe('福岡県福岡市博多区');
      expect(formatAddressToCityLevel('佐賀県佐賀市城内1-1-59')).toBe('佐賀県佐賀市');
      expect(formatAddressToCityLevel('長崎県長崎市尾上町3-1')).toBe('長崎県長崎市');
      expect(formatAddressToCityLevel('熊本県熊本市中央区水前寺6-18-1')).toBe('熊本県熊本市中央区');
      expect(formatAddressToCityLevel('大分県大分市大手町3-1-1')).toBe('大分県大分市');
      expect(formatAddressToCityLevel('宮崎県宮崎市橘通東2-10-1')).toBe('宮崎県宮崎市');
      expect(formatAddressToCityLevel('鹿児島県鹿児島市鴨池新町10-1')).toBe('鹿児島県鹿児島市');
      expect(formatAddressToCityLevel('沖縄県那覇市泉崎1-2-2')).toBe('沖縄県那覇市');
    });
  });

  // 東京都のテストケース
  describe('東京都の住所', () => {
    test('23区の住所を区まで抽出', () => {
      expect(formatAddressToCityLevel('東京都渋谷区神宮前1-2-3')).toBe('東京都渋谷区');
      expect(formatAddressToCityLevel('東京都新宿区西新宿2-8-1')).toBe('東京都新宿区');
      expect(formatAddressToCityLevel('東京都千代田区霞が関1-1-1')).toBe('東京都千代田区');
    });

    test('市部の住所を市まで抽出', () => {
      expect(formatAddressToCityLevel('東京都八王子市元本郷町1-2-3')).toBe('東京都八王子市');
      expect(formatAddressToCityLevel('東京都立川市曙町2-1-1')).toBe('東京都立川市');
    });

    test('郡部の住所を町村まで抽出', () => {
      expect(formatAddressToCityLevel('東京都西多摩郡瑞穂町大字箱根ケ崎1234')).toBe('東京都西多摩郡瑞穂町');
    });
  });

  // その他の都道府県のテストケース
  describe('その他の都道府県の住所', () => {
    test('政令指定都市の区まで抽出', () => {
      expect(formatAddressToCityLevel('愛知県名古屋市千種区千種三丁目１９番１８号')).toBe('愛知県名古屋市千種区');
      expect(formatAddressToCityLevel('神奈川県横浜市中区本町1-1')).toBe('神奈川県横浜市中区');
      expect(formatAddressToCityLevel('大阪府大阪市北区梅田1-1-1')).toBe('大阪府大阪市北区');
    });

    test('一般の市まで抽出', () => {
      expect(formatAddressToCityLevel('埼玉県川越市元町1-3-1')).toBe('埼玉県川越市');
      expect(formatAddressToCityLevel('千葉県船橋市本町1-1-1')).toBe('千葉県船橋市');
    });

    test('郡部の町村まで抽出', () => {
      expect(formatAddressToCityLevel('埼玉県比企郡小川町大字大塚1234')).toBe('埼玉県比企郡小川町');
      expect(formatAddressToCityLevel('長野県北佐久郡軽井沢町大字軽井沢1234')).toBe('長野県北佐久郡軽井沢町');
    });
  });

  // 20政令指定都市すべてのテストケース
  describe('20政令指定都市の住所', () => {
    test('政令指定都市（都道府県付き）', () => {
      expect(formatAddressToCityLevel('北海道札幌市中央区北1条西2丁目')).toBe('北海道札幌市中央区');
      expect(formatAddressToCityLevel('宮城県仙台市青葉区国分町3-7-1')).toBe('宮城県仙台市青葉区');
      expect(formatAddressToCityLevel('埼玉県さいたま市浦和区高砂3-15-1')).toBe('埼玉県さいたま市浦和区');
      expect(formatAddressToCityLevel('千葉県千葉市中央区市場町1-1')).toBe('千葉県千葉市中央区');
      expect(formatAddressToCityLevel('神奈川県横浜市中区日本大通1')).toBe('神奈川県横浜市中区');
      expect(formatAddressToCityLevel('神奈川県川崎市幸区堀川町580')).toBe('神奈川県川崎市幸区');
      expect(formatAddressToCityLevel('神奈川県相模原市中央区中央2-11-15')).toBe('神奈川県相模原市中央区');
      expect(formatAddressToCityLevel('新潟県新潟市中央区学校町通1-602-1')).toBe('新潟県新潟市中央区');
      expect(formatAddressToCityLevel('静岡県静岡市葵区追手町5-1')).toBe('静岡県静岡市葵区');
      expect(formatAddressToCityLevel('静岡県浜松市中央区元城町103-2')).toBe('静岡県浜松市中央区');
      expect(formatAddressToCityLevel('愛知県名古屋市中区三の丸3-1-1')).toBe('愛知県名古屋市中区');
      expect(formatAddressToCityLevel('京都府京都市中京区寺町通御池上る上本能寺前町488')).toBe('京都府京都市中京区');
      expect(formatAddressToCityLevel('大阪府大阪市北区中之島1-3-20')).toBe('大阪府大阪市北区');
      expect(formatAddressToCityLevel('大阪府堺市堺区南瓦町3-1')).toBe('大阪府堺市堺区');
      expect(formatAddressToCityLevel('兵庫県神戸市中央区加納町6-5-1')).toBe('兵庫県神戸市中央区');
      expect(formatAddressToCityLevel('岡山県岡山市北区大供1-1-1')).toBe('岡山県岡山市北区');
      expect(formatAddressToCityLevel('広島県広島市中区国泰寺町1-6-34')).toBe('広島県広島市中区');
      expect(formatAddressToCityLevel('福岡県北九州市小倉北区城内1-1')).toBe('福岡県北九州市小倉北区');
      expect(formatAddressToCityLevel('福岡県福岡市中央区天神1-8-1')).toBe('福岡県福岡市中央区');
      expect(formatAddressToCityLevel('熊本県熊本市中央区手取本町1-1')).toBe('熊本県熊本市中央区');
    });

    test('政令指定都市（都道府県省略）', () => {
      expect(formatAddressToCityLevel('札幌市中央区北1条西2丁目')).toBe('札幌市中央区');
      expect(formatAddressToCityLevel('仙台市青葉区国分町3-7-1')).toBe('仙台市青葉区');
      expect(formatAddressToCityLevel('さいたま市浦和区高砂3-15-1')).toBe('さいたま市浦和区');
      expect(formatAddressToCityLevel('千葉市中央区市場町1-1')).toBe('千葉市中央区');
      expect(formatAddressToCityLevel('横浜市中区日本大通1')).toBe('横浜市中区');
      expect(formatAddressToCityLevel('川崎市中原区下小田中一丁目５番７－３０８号')).toBe('川崎市中原区');
      expect(formatAddressToCityLevel('相模原市中央区中央2-11-15')).toBe('相模原市中央区');
      expect(formatAddressToCityLevel('新潟市中央区学校町通1-602-1')).toBe('新潟市中央区');
      expect(formatAddressToCityLevel('静岡市葵区追手町5-1')).toBe('静岡市葵区');
      expect(formatAddressToCityLevel('浜松市中央区元城町103-2')).toBe('浜松市中央区');
      expect(formatAddressToCityLevel('名古屋市千種区千種三丁目１９番１８号')).toBe('名古屋市千種区');
      expect(formatAddressToCityLevel('京都市中京区寺町通御池上る上本能寺前町488')).toBe('京都市中京区');
      expect(formatAddressToCityLevel('大阪市中央区本町1-1-1')).toBe('大阪市中央区');
      expect(formatAddressToCityLevel('堺市堺区南瓦町3-1')).toBe('堺市堺区');
      expect(formatAddressToCityLevel('神戸市中央区加納町6-5-1')).toBe('神戸市中央区');
      expect(formatAddressToCityLevel('岡山市北区大供1-1-1')).toBe('岡山市北区');
      expect(formatAddressToCityLevel('広島市中区国泰寺町1-6-34')).toBe('広島市中区');
      expect(formatAddressToCityLevel('北九州市小倉北区城内1-1')).toBe('北九州市小倉北区');
      expect(formatAddressToCityLevel('福岡市中央区天神1-8-1')).toBe('福岡市中央区');
      expect(formatAddressToCityLevel('熊本市中央区手取本町1-1')).toBe('熊本市中央区');
    });
  });

  // 都道府県が省略されているケース
  describe('都道府県が省略されている住所', () => {
    test('政令指定都市の場合', () => {
      expect(formatAddressToCityLevel('名古屋市千種区千種三丁目１９番１８号')).toBe('名古屋市千種区');
      expect(formatAddressToCityLevel('川崎市中原区下小田中一丁目５番７－３０８号')).toBe('川崎市中原区');
      expect(formatAddressToCityLevel('横浜市港北区新横浜2-100-45')).toBe('横浜市港北区');
      expect(formatAddressToCityLevel('大阪市中央区本町1-1-1')).toBe('大阪市中央区');
    });

    test('一般の市の場合', () => {
      expect(formatAddressToCityLevel('豊田市西町1-200')).toBe('豊田市');
      expect(formatAddressToCityLevel('船橋市本町1-1-1')).toBe('船橋市');
    });
  });

  // エッジケース
  describe('エッジケース', () => {
    test('空文字列の場合', () => {
      expect(formatAddressToCityLevel('')).toBe('');
    });

    test('nullやundefinedの場合', () => {
      expect(formatAddressToCityLevel(null as any)).toBe('');
      expect(formatAddressToCityLevel(undefined as any)).toBe('');
    });

    test('不完全な住所の場合', () => {
      expect(formatAddressToCityLevel('東京都')).toBe('東京都');
      expect(formatAddressToCityLevel('愛知県')).toBe('愛知県');
    });

    test('特殊な表記の住所', () => {
      expect(formatAddressToCityLevel('東京都江戸川区西葛西６－１５－２')).toBe('東京都江戸川区');
      expect(formatAddressToCityLevel('川崎市中原区下小田中一丁目５番７－３０８号ノーブル中原')).toBe('川崎市中原区');
    });
  });
});