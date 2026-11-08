/**
 * 出題範囲マップ。時代×地域の単元（unit 帯）と、横断的な頻出テーマ（frequent 帯）。
 * 頻出度は公開情報（第44回の解答・受検記）と高校世界史探究の標準的な配分からの推定。
 * 根拠と未確認の点は docs/exam-research.md を参照。
 */

export const ERAS = ["古代", "中世", "近世", "近代", "現代", "テーマ史"] as const;
export type Era = (typeof ERAS)[number];
export type Frequency = "高" | "中" | "低";

export type Unit = {
  id: string;
  era: Era;
  region: string;
  title: string;
  frequency: Frequency;
};

export const UNITS: readonly Unit[] = [
  { id: "u01", era: "古代", region: "オリエント", title: "メソポタミア・エジプト・ヘブライ・アケメネス朝", frequency: "中" },
  { id: "u02", era: "古代", region: "地中海", title: "ギリシア（ポリス・ペルシア戦争・ヘレニズム）", frequency: "高" },
  { id: "u03", era: "古代", region: "地中海", title: "ローマ（共和政・帝政・キリスト教・ローマ文化）", frequency: "高" },
  { id: "u04", era: "古代", region: "イラン", title: "パルティア・ササン朝", frequency: "低" },
  { id: "u05", era: "古代", region: "南アジア", title: "インダス文明〜マウリヤ朝・クシャーナ朝・グプタ朝", frequency: "中" },
  { id: "u06", era: "古代", region: "東南アジア", title: "東南アジアの諸国家（扶南〜アンコール）", frequency: "低" },
  { id: "u07", era: "古代", region: "中国", title: "殷・周〜春秋戦国・諸子百家", frequency: "高" },
  { id: "u08", era: "古代", region: "中国", title: "秦・漢と周辺民族・東アジア交流", frequency: "高" },
  { id: "u09", era: "古代", region: "中国", title: "魏晋南北朝", frequency: "中" },
  { id: "u10", era: "中世", region: "中国", title: "隋・唐（律令・文化）", frequency: "高" },
  { id: "u11", era: "中世", region: "中国", title: "五代・宋・遼・金・西夏", frequency: "高" },
  { id: "u12", era: "中世", region: "内陸アジア", title: "遊牧国家とモンゴル帝国・元", frequency: "高" },
  { id: "u13", era: "中世", region: "イスラーム", title: "イスラームの成立〜ウマイヤ朝・アッバース朝", frequency: "高" },
  { id: "u14", era: "中世", region: "イスラーム", title: "イスラーム世界の分裂（ファーティマ朝・セルジューク朝など）", frequency: "高" },
  { id: "u15", era: "中世", region: "イスラーム", title: "イスラーム文化・マムルーク朝・イル＝ハン国", frequency: "中" },
  { id: "u16", era: "中世", region: "ヨーロッパ", title: "ゲルマン人の移動・フランク王国・ノルマン人", frequency: "高" },
  { id: "u17", era: "中世", region: "ヨーロッパ", title: "ビザンツ帝国・東欧とスラヴ人", frequency: "中" },
  { id: "u18", era: "中世", region: "ヨーロッパ", title: "封建社会・教皇権・十字軍・中世都市", frequency: "高" },
  { id: "u19", era: "中世", region: "ヨーロッパ", title: "中世後期の英仏・中世文化", frequency: "中" },
  { id: "u20", era: "中世", region: "南アジア・アフリカ", title: "デリー＝スルタン朝・アフリカの諸王国", frequency: "低" },
  { id: "u21", era: "近世", region: "中国", title: "明（政治・文化・科学）", frequency: "高" },
  { id: "u22", era: "近世", region: "中国", title: "清（康熙〜乾隆・統治体制）", frequency: "高" },
  { id: "u23", era: "近世", region: "東アジア", title: "朝鮮王朝・日本との関係・朝貢体制", frequency: "中" },
  { id: "u24", era: "近世", region: "イスラーム", title: "オスマン帝国", frequency: "高" },
  { id: "u25", era: "近世", region: "イスラーム", title: "サファヴィー朝・ムガル帝国", frequency: "高" },
  { id: "u26", era: "近世", region: "ヨーロッパ", title: "大航海時代・アメリカ大陸の文明", frequency: "高" },
  { id: "u27", era: "近世", region: "ヨーロッパ", title: "ルネサンス・宗教改革", frequency: "高" },
  { id: "u28", era: "近世", region: "ヨーロッパ", title: "主権国家体制・絶対王政・三十年戦争", frequency: "高" },
  { id: "u29", era: "近世", region: "ヨーロッパ", title: "17〜18世紀の文化・科学革命・啓蒙思想", frequency: "中" },
  { id: "u30", era: "近代", region: "欧米", title: "イギリス革命・産業革命", frequency: "高" },
  { id: "u31", era: "近代", region: "欧米", title: "アメリカ独立革命・フランス革命・ナポレオン", frequency: "高" },
  { id: "u32", era: "近代", region: "ラテンアメリカ", title: "ハイチ革命・ラテンアメリカ諸国の独立", frequency: "中" },
  { id: "u33", era: "近代", region: "欧米", title: "ウィーン体制・1848年革命・イタリアとドイツの統一", frequency: "高" },
  { id: "u34", era: "近代", region: "欧米", title: "19世紀のアメリカ合衆国・ロシアの改革", frequency: "中" },
  { id: "u35", era: "近代", region: "西アジア", title: "オスマン帝国の改革・エジプト・イラン", frequency: "中" },
  { id: "u36", era: "近代", region: "南・東南アジア", title: "インドと東南アジアの植民地化", frequency: "中" },
  { id: "u37", era: "近代", region: "中国", title: "アヘン戦争〜辛亥革命", frequency: "高" },
  { id: "u38", era: "近代", region: "世界", title: "帝国主義・アフリカ分割", frequency: "高" },
  { id: "u39", era: "現代", region: "世界", title: "第一次世界大戦・ロシア革命", frequency: "高" },
  { id: "u40", era: "現代", region: "世界", title: "ヴェルサイユ体制・戦間期・世界恐慌", frequency: "高" },
  { id: "u41", era: "現代", region: "アジア", title: "戦間期のアジアの民族運動（中国・インド・トルコ）", frequency: "中" },
  { id: "u42", era: "現代", region: "世界", title: "第二次世界大戦", frequency: "高" },
  { id: "u43", era: "現代", region: "世界", title: "冷戦の展開と終結", frequency: "高" },
  { id: "u44", era: "現代", region: "アジア・アフリカ", title: "中国現代史・脱植民地化・中東問題", frequency: "高" },
  { id: "u45", era: "テーマ史", region: "横断", title: "東西交流・宗教史・科学技術史・社会史", frequency: "中" },
];

export type Topic = { id: string; title: string; description: string };

/** 頻出帯のテーマ。地域・時代をまたいで問われやすい切り口 */
export const TOPICS: readonly Topic[] = [
  { id: "t-era-sense", title: "年代の精度・同時代", description: "内容は正しいが時代がずれた選択肢を見抜く。世紀・年代整序" },
  { id: "t-china-system", title: "中国王朝の制度", description: "土地制度・税制・官吏登用・兵制の王朝ごとの違い" },
  { id: "t-china-culture", title: "中国の学問と文化", description: "儒学・史書・文学・技術・科学書と著者" },
  { id: "t-islam-dynasty", title: "イスラーム王朝の興亡と都", description: "王朝名・建国者・首都・君主称号の取り違え" },
  { id: "t-christianity", title: "キリスト教史", description: "公会議・教皇・修道会・宗派・宗教改革" },
  { id: "t-revolutions", title: "市民革命", description: "イギリス・アメリカ・フランス・ハイチの革命の経過と文書" },
  { id: "t-nation-state", title: "19世紀の国民国家と改革", description: "統一・改革・自由主義運動" },
  { id: "t-imperialism", title: "帝国主義と植民地化", description: "列強の進出・分割・抵抗運動" },
  { id: "t-world-wars", title: "二つの世界大戦と講和", description: "開戦の経緯・主要な戦い・講和条約・国際機構" },
  { id: "t-cold-war", title: "冷戦と戦後世界", description: "冷戦の出来事・地域紛争・脱植民地化・冷戦終結" },
  { id: "t-east-west", title: "東西交流", description: "シルクロード・海の道・旅行者・宣教師・伝来した文物" },
  { id: "t-thinkers", title: "思想家と著作", description: "古代〜近代の思想家・著作・主張の対応" },
  { id: "t-art-science", title: "美術・建築・科学", description: "作品と作者、建築様式、発明・発見" },
  { id: "t-persons", title: "君主と改革者の業績", description: "人物と業績の対応、同名・類似人物の区別" },
  { id: "t-treaties", title: "条約と国際会議", description: "条約・会議の内容と当事国・時期" },
  { id: "t-places", title: "都市・地名", description: "首都・戦場・遺跡・港市の位置と出来事（地図問題の代わり）" },
];

export const UNIT_IDS: ReadonlySet<string> = new Set(UNITS.map((u) => u.id));
export const TOPIC_IDS: ReadonlySet<string> = new Set(TOPICS.map((t) => t.id));
