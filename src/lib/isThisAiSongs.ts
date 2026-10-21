/**
 * "Is This AI?" catalog — labeled YouTube clips (no audio API).
 * Thumbnails: https://img.youtube.com/vi/{id}/hqdefault.jpg
 * Regenerated from ChouChallenge.md via scripts/fetch-ai-human-meta.mjs
 */
import type { TrackInfo } from "@/types/game";

export type AiHumanLabel = "AI" | "Human";

export interface AiClipTrack extends TrackInfo {
  youtubeVideoId: string;
  aiLabel: AiHumanLabel;
}

function clip(
  youtubeVideoId: string,
  aiLabel: AiHumanLabel,
  name: string,
  english: string
): AiClipTrack {
  return {
    id: `yt-${youtubeVideoId}`,
    name,
    english,
    youtubeVideoId,
    aiLabel,
    artworkUrl: `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`,
  };
}

/** Short display titles for the UI (channel/author kept as english). */
export const IS_THIS_AI_CLIPS: AiClipTrack[] = [
  // AI (66)
  clip("KzfnIcZrDbs", "AI", "Jay Chou 周杰倫 – 青花瓷 (Blue and White Porcelain)", "Eternal Melody AI"),
  clip("vWXnT45RuFo", "AI", "Andy Lau 劉德華 – 謝謝你的愛 (Thank You for Your Love)", "Eternal Melody AI"),
  clip("jlrs-q3tRA8", "AI", "擱淺", "Haohao Music"),
  clip("J0sZw_owJVY", "AI", "有一種遺憾叫我們-韓小欠ft.你的婚禮", "Haohao Music"),
  clip("j0Kqr4WHmSo", "AI", "戀人未滿(R&B) / Haohao", "Haohao Music"),
  clip("Akk1AqPIINc", "AI", "安靜 (R&B Ver.)", "Haohao Music"),
  clip("Jt4DYNmqQjI", "AI", "楓(R&B)/ Haohao", "Haohao Music"),
  clip("yqsotpX38RI", "AI", "謝謝你的愛（撕心版）/ 京六", "Haohao Music"),
  clip("eXGDi57MgxI", "AI", "Ge Qian (擱淺) - Jay Chou", "MetzTone"),
  clip("Q_to-9EaPI8", "AI", "Jay Chou (周杰伦)", "novatune"),
  clip("D_G-l3aTjVA", "AI", "Jay Chou (周杰伦) - Jie Kou (借口)", "novatune"),
  clip("4LwPndKq5j4", "AI", "Jay Chou (周杰倫) - 七里香 (Qi Li Xiang) Common Ora…", "FM Station"),
  clip("TLsU7VW2pqM", "AI", "Jay Chou (周杰倫) - Chrysanthemum Terrace (菊花台)", "FM Station"),
  clip("vxHd15dpSZM", "AI", "Jay Chou (周杰倫) - What Kind of Man (算什麼男人)", "FM Station"),
  clip("uzlz_rX02q4", "AI", "Jay Chou 周杰倫 - Tui Hou 退後", "MetzTone"),
  clip("leUBfGDNZak", "AI", "愛我別走 (Ai Wo Bie Zou) - 張震嶽", "novatune"),
  clip("4YolrbxcHZo", "AI", "童話 Tong Hua", "novatune"),
  clip("knzEBnX1-G8", "AI", "戀人未滿 2.0", "二點零制作 2.0 CREW"),
  clip("FcWkg6D6yPc", "AI", "《恋人未满》 Liàn Rén Wèi Mǎn – S.H.E", "MetzTone"),
  clip("5PTY0gLr05M", "AI", "记得 2.0", "二點零制作 2.0 CREW"),
  clip("7tZ0iz0W25o", "AI", "【AI 孙燕姿】 《发如雪》cover 周杰伦", "AI孙燕姿 sunyanzi"),
  clip("vVMl6wk3APo", "AI", "【AI 孙燕姿 】《下雨天》cover 南拳妈妈", "AI孙燕姿 sunyanzi"),
  clip("vWBOWBakLSA", "AI", "【AI 孙燕姿】《被动》cover 伍佰", "AI孙燕姿 sunyanzi"),
  clip("SvgyIXORKHM", "AI", "【AI 孙燕姿 × 周杰伦】《暗号》合唱版 别管那是非，只要我们感觉对", "AI孙燕姿 sunyanzi"),
  clip("SPrWv5q1Ze4", "AI", "【AI 孙燕姿】《七里香》秋刀鱼的滋味，猫跟你都想了解", "AI孙燕姿 sunyanzi"),
  clip("BigMJ-CdJaI", "AI", "【AI翻唱 不是“孙燕姿”】《髮如雪》 cover JAY（京劇还是太为难2.0版本的AI了）", "华语AI翻唱"),
  clip("U1I7vOfvEBs", "AI", "安靜 - 周杰倫", "音樂迷航地圖"),
  clip("vaYMf8JNu-w", "AI", "《梦醒时分》CITYPOP风格COVER蒸汽波", "花吹雪"),
  clip("znAyzpUufQ0", "AI", "擱淺", "Capt. Lilia Iwasko"),
  clip("OzqsSQPuM5c", "AI", "龍捲風", "Capt. Lilia Iwasko"),
  clip("AIASQVD7qKU", "AI", "簡單愛", "Capt. Lilia Iwasko"),
  clip("YAgzCNozM5M", "AI", "【太陽與地球 盧廣仲 Crowd Lu - 流行搖滾 AI 翻唱 Pop Rock Cover", "EdAiMusic"),
  clip("jYENdyA5joA", "AI", "【普通朋友 陶喆 David Tao - R&B Acapella Ai 翻唱 Cover】", "EdAiMusic"),
  clip("ns6TZkUXAoo", "AI", "【髮如雪 周杰倫 Jay Chou - R&B Duet Ai 翻唱 Cover 】", "EdAiMusic"),
  clip("J4ffGfufpNc", "AI", "【看著我的眼睛說 張遠 Zhang Yuan - 90‘s R&B Duet Ai 翻唱…", "EdAiMusic"),
  clip("e084zYwmyxA", "AI", "唯一 2.0", "二點零制作 2.0 CREW"),
  clip("xJete_LPYfE", "AI", "【擱淺 - 周杰倫 Jay Chou R&B 男女合唱 Duet Ai 翻唱 Cover 】", "EdAiMusic"),
  clip("dCy4mjC-CyY", "AI", "謝謝你的愛 (Xie Xie Ni De Ai)", "Celestial Rock"),
  clip("vP1beAVSEYQ", "AI", "聽海 (Ting Hai) – Male Slow Rock Version That B…", "Celestial Rock"),
  clip("GEUA5zGuF-U", "AI", "[AI翻唱]歌曲焕新计划-月亮惹的祸", "RTT Audio-Visual Space"),
  clip("PiPHrCXjsOs", "AI", "一首歌唱完一生... Lily三版演绎《明年今日》：从懵懂少女到遗憾路人 (Cover 陈奕迅)", "StarVoxLily"),
  clip("RgM5jwOBgxI", "AI", "《海阔天空》抒情版", "StarVoxLily"),
  clip("CSDxVCrBFuY", "AI", "完整版——周杰伦《一路向北》女声版，电影《头文字D》插曲。【动态歌词lyrics】#歌曲改…", "Chole (柯唯)"),
  clip("sWuarGAVK5I", "AI", "谭咏麟粤语歌《一生中最爱》女声翻唱完整版，#空灵女声 #治愈女声 #经典老歌 #粤语歌", "Chole (柯唯)"),
  clip("YEiKb3O6CK0", "AI", "周杰伦中国风歌曲《青花瓷》+《东风破》+《千里之外》空灵女声版，你更喜欢哪一首呢？柯唯Ch…", "Chole (柯唯)"),
  clip("THFwncpblUA", "AI", "经典粤语歌：《偏偏喜欢你》+《一生何求》+《一生中最爱》柯唯Chole(Cover 陈百强…", "Chole (柯唯)"),
  clip("7ecOSdcqX1k", "AI", "Forever Love 2.0", "二點零制作 2.0 CREW"),
  clip("eOOcvTCgUIc", "AI", "《爱与痛的边缘》Lily深情翻唱", "StarVoxLily"),
  clip("wqJ-uX_edSY", "AI", "【AI 孙燕姿 】《Melody》 能否听我唱完这一段旋律 请不要离去", "AI孙燕姿翻唱 AI Stefanie Sun"),
  clip("3WU5m0As77A", "AI", "【AI音乐】假如方大同翻唱陶喆的《天天》 #AI #R&B #陶喆 #方大同", "中文AI-MUSIC"),
  clip("_ACz-yr0-ho", "AI", "【AI 孙燕姿】《天天》cover 陶喆", "Chris Xu"),
  clip("Ai7n7iIQo5o", "AI", "【AI 邓紫棋】 《蒲公英的约定》cover 周杰伦", "Chris Xu"),
  clip("0oKCM9OjJV8", "AI", "【AI张惠妹】《枫》cover 周杰伦", "Chris Xu"),
  clip("L-2QIQyB5mQ", "AI", "【AI 孙燕姿】《你听得到》cover 周杰伦", "Chris Xu"),
  clip("AHoRu6XT0nA", "AI", "【AI 孙燕姿 × AI 周杰伦】《蒲公英的约定》cover 周杰伦", "Chris Xu"),
  clip("PSCFQiBONCU", "AI", "【AI 孙燕姿】《Melody》", "寂寞的渲染_"),
  clip("DEPEOWMoDRU", "AI", "当《Melody》遇上 AI 方大同 cover 陶喆", "AI翻唱whe"),
  clip("eEWbR2u_t8c", "AI", "【AI 翻唱 “周杰伦”】《淘汰》cover 陈奕迅 #周杰伦 #jaychou #淘汰", "AI翻唱whe"),
  clip("6L0zPoS1pv8", "AI", "当《遇见》遇上 AI 周杰伦 Jay Chou cover 孙燕姿", "AI翻唱whe"),
  clip("9utiDguk1wM", "AI", "当《青花瓷》遇上 AI Justin Biber cover 周杰伦 #justinbieber", "AI翻唱whe"),
  clip("mg8NYZCkWXA", "AI", "当《特别的人》遇上 AI Justin Biber cover 方大同 #方大同", "AI翻唱whe"),
  clip("hR38nRrrJAY", "AI", "当《红豆》遇上 AI Justin Biber cover 方大同", "AI翻唱whe"),
  clip("qZX2zycrWYU", "AI", "当《安静》遇上 AI Justin Biber cover 周杰伦", "AI翻唱whe"),
  clip("m1Gy_0QXqn0", "AI", "《雙星情歌》MV", "CCG"),
  clip("xioIhSoE7rs", "AI", "情已逝~張學友 [Cover by Aiyanna.V]", "AiyannaV"),
  clip("ulP7z82DGec", "AI", "遙遠的她~張學友 [Cover by Aiyanna.V]", "AiyannaV"),

  // Human (36)
  clip("Hdaw7VzYBEA", "Human", "街头！达文西和十四姐合唱周杰伦的《珊瑚海》“海鸟跟鱼相爱，只是一场意外”", "长沙街唱"),
  clip("Ih-hfalUNg4", "Human", "長沙街頭翻唱《楓》，一開口路人紛紛圍觀！", "长沙街唱"),
  clip("R2KYPGhKh3U", "Human", "周杰倫 Jay Chou -【手寫的從前】", "PocatsStudio"),
  clip("GVRceRv1xZY", "Human", "陶喆 David Tao -【天天 Close To You】", "PocatsStudio"),
  clip("JTEB0xKeaLY", "Human", "G.E.M.【光年之外 LIGHT YEARS AWAY 】男女對唱", "文慧如Boon Hui Lu"),
  clip("CR_dzL6HU8c", "Human", "Jay Chou Mashup 周杰伦经典情歌串烧 by Iris Zhang", "Iris Zhang"),
  clip("yuPgbOnAfZw", "Human", "Monkey Legion - \"反方向的钟\", \"安静\", \"龙卷风\" [feat. 绿…", "Fan Dragon Xiangzi"),
  clip("Jg9UiogkTj4", "Human", "周杰倫 Jay Chou【告白气球】非洲保安 Gao Bai Qi Qiu Cover", "卢旺达青年团"),
  clip("Fa6sVEpyCd8", "Human", "Wang Lee Hom - Ai De Jiu Shi Ni (王力宏 - 愛的就是你)", "PennYo"),
  clip("TCA7BFr3CJ0", "Human", "不该翻唱 - 周杰伦Jay Chou X aMEI R&B版 by Pianoman苏阳", "Elie苏阳"),
  clip("YD9NOeQnjng", "Human", "稻香-周杰伦-pianoman苏阳", "Elie苏阳"),
  clip("0aBRrwdNQu8", "Human", "告白气球+稻香- 周杰伦Jay Chou R&B版 by Pianoman苏阳", "Elie苏阳"),
  clip("0RRjYjWB-QU", "Human", "恋人未满 - S.H.E. (R&B cover)", "Misolydian"),
  clip("ysD5b5lKHaw", "Human", "周杰倫經典串燒 Jay Chou Mashup（修復版）", "倆人 Acoustic Too"),
  clip("xLh1xEyEIww", "Human", "園遊會 Fun Fair - 周杰倫 Jay Chou", "倆人 Acoustic Too"),
  clip("lPM-pMDEPHA", "Human", "世界末日End of the World - 周杰倫Jay Chou", "倆人 Acoustic Too"),
  clip("0Sifbpy398Y", "Human", "\"告白氣球\" - Jay Chou (Jason Chen Cover)", "MusicNeverSleeps"),
  clip("rBeEl3HYZEM", "Human", "Mojito - Jay Chou (Chinese/English Cover) Jas…", "MusicNeverSleeps"),
  clip("biSB9_Z3VUw", "Human", "杰倫心目中的完美cover-蔡健雅(愛情廢柴X說好不哭)", "周杰倫 Jay Chou"),
  clip("q_bC81LYLWs", "Human", "周杰倫 - 世界末日", "Jasmine C"),
  clip("9Kynu5nQKxI", "Human", "(Jay Chou) Love Confession - Gabriella Quevedo", "Gabriella Quevedo"),
  clip("eE6C-trEaz4", "Human", "想把周杰倫 Jay Chou 的【夜曲 Nocturne】唱給你。", "Jing Cover"),
  clip("d3OZPKG1kNU", "Human", "清天 - Jay Chou", "EZE MUSIC STUDIO "),
  clip("qD5o2a5b5n8", "Human", "七里香 Common Jasmine Orange - 周杰倫 Jay Chou", "Andy Liang"),
  clip("K4sJVwifuvw", "Human", "Love Confession告白气球 /Jay Chou （Arrangement by…", "Jaco Liu"),
  clip("FnOtOux5kEs", "Human", "周杰伦 《园游会》 女生版 兰天 翻唱", "FUN IN音乐"),
  clip("AawESk8r-1I", "Human", "周杰倫 JAY【告白氣球】陳星合", "我是星合HE's channel"),
  clip("9N883jv7H6o", "Human", "GROUNDzero cover of Jay chou's HuoYuanJia", "soundcheckprollp"),
  clip("i2Lo4QmZX50", "Human", "安静 Silence 周杰伦 Jay Chou 英文版 ENGLISH VERSION 心…", "Cydney 鑫妮"),
  clip("TQe6jXYKmXo", "Human", "說好不哭 Won't Cry - Sam Tsui & Nathan Hartono Co…", "TheSamTsui"),
  clip("qLWGHd58Iug", "Human", "Jay Chou - Long Juan Feng Cover", "Wilson Choo"),
  clip("BZsRlemIb50", "Human", "\"告白氣球\" - Jay Chou (KHS, Casey Breves, & Jasmi…", "Kurt Hugo Schneider"),
  clip("d9uZSzCei5o", "Human", "說好不哭 \"Won't Cry\" - Chinese/English Version 周杰…", "JasonChenAsia"),
  clip("OduXN-Zdz_A", "Human", "周杰倫jaychou-火红歌曲串烧合集", "J 频道"),
  clip("UkuYokVOBFY", "Human", "周杰倫 Jay Chou - 最长的电影 The Longest Movie (Cover…", "Xian Ming"),
  clip("l9yX7qCXHNQ", "Human", "千里之外 cover", "Tony"),
];

export const AI_OR_HUMAN_CHOICES = [
  { name: "AI", english: "Generated / AI cover" },
  { name: "Human", english: "Real human performance" },
] as const;

export function getIsThisAiSongList(): TrackInfo[] {
  return IS_THIS_AI_CLIPS;
}

export function getAiClipById(id: string): AiClipTrack | undefined {
  return IS_THIS_AI_CLIPS.find((c) => c.id === id);
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeEmbedUrl(
  videoId: string,
  startSec: number,
  durationSec: number
): string {
  const start = Math.max(0, Math.floor(startSec));
  const end = start + Math.max(1, Math.floor(durationSec));
  const params = new URLSearchParams({
    autoplay: "1",
    controls: "0",
    modestbranding: "1",
    playsinline: "1",
    rel: "0",
    start: String(start),
    end: String(end),
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
