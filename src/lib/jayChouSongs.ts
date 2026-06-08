/**
 * Curated Jay Chou discography for trivia choices.
 * Each entry has a Chinese title (`name`) and its English title (`english`).
 * Audio previews are resolved at runtime via the iTunes Search API.
 */
import type { TrackInfo } from "@/types/game";

export const JAY_CHOU_SONGS: TrackInfo[] = [
  { id: "qinghuaci", name: "青花瓷", english: "Blue and White Porcelain" },
  { id: "daoxiang", name: "稻香", english: "Rice Field" },
  { id: "yequ", name: "夜曲", english: "Nocturne" },
  { id: "qilixiang", name: "七里香", english: "Orange Jasmine" },
  { id: "qingtian", name: "晴天", english: "Sunny Day" },
  { id: "juhua", name: "菊花台", english: "Chrysanthemum Terrace" },
  { id: "dongfengpo", name: "东风破", english: "East Wind Breaks" },
  { id: "faxue", name: "发如雪", english: "Hair Like Snow" },
  { id: "hongchen", name: "红尘客栈", english: "Red Dust Inn" },
  { id: "yanhuayileng", name: "烟花易冷", english: "Fireworks Cool Easily" },
  { id: "shuangjiegun", name: "双节棍", english: "Nunchucks" },
  { id: "jian", name: "简单爱", english: "Simple Love" },
  { id: "tingmama", name: "听妈妈的话", english: "Listen to Mom" },
  { id: "geqi", name: "搁浅", english: "Stranded" },
  { id: "mojiezuo", name: "牛仔很忙", english: "Cowboy on the Run" },
  { id: "yuanxiaojie", name: "园游会", english: "Garden Party" },
  { id: "anhao", name: "暗号", english: "Secret Signal" },
  { id: "fanfangxiang", name: "反方向的钟", english: "Counterclockwise Clock" },
  { id: "aiya", name: "爱在西元前", english: "Love Before BC" },
  { id: "longjuan", name: "龙卷风", english: "Tornado" },
  { id: "xingqing", name: "星晴", english: "Starry Mood" },
  { id: "mojie", name: "默", english: "Silence" },
  { id: "shuai", name: "退后", english: "Step Back" },
  { id: "huahai", name: "花海", english: "Sea of Flowers" },
  { id: "shuohaobuku", name: "说好不哭", english: "Won't Cry" },
  { id: "mojiezuoshuo", name: "不能说的秘密", english: "Secret" },
  { id: "qianlizhiwai", name: "千里之外", english: "Far Away" },
  { id: "piano", name: "枫", english: "Maple" },
  { id: "xiangsi", name: "一路向北", english: "All the Way North" },
  { id: "jiangnan", name: "江南", english: "South of the River" },
  { id: "yanhuasui", name: "烟花", english: "Fireworks" },
  { id: "minzufeng", name: "本草纲目", english: "Compendium of Materia Medica" },
  { id: "zuiweida", name: "最伟大的作品", english: "Greatest Works of Art" },
  { id: "lantingxu", name: "兰亭序", english: "Orchid Pavilion Preface" },
  { id: "chaorenbuhuifei", name: "超人不会飞", english: "Superman Can't Fly" },
  { id: "shouxiedecongqian", name: "手写的从前", english: "Handwritten Past" },
  { id: "guiji", name: "轨迹", english: "Traces" },
  { id: "jiekou", name: "借口", english: "Excuse" },
  { id: "shanhuhai", name: "珊瑚海", english: "Coral Sea" },
  { id: "baisefengche", name: "白色风车", english: "White Windmill" },
  { id: "waipo", name: "外婆", english: "Grandma" },
  { id: "yeyepaodecha", name: "爷爷泡的茶", english: "Grandpa's Tea" },
  { id: "anjing", name: "安静", english: "Quiet" },
  { id: "kaibuliaokou", name: "开不了口", english: "Can't Speak" },
  { id: "fenlie", name: "分裂", english: "Split" },
  { id: "yifuzhiming", name: "以父之名", english: "In the Name of the Father" },
  { id: "bandao", name: "半岛铁盒", english: "Peninsula Iron Box" },
  { id: "keainvren", name: "可爱女人", english: "Adorable Woman" },
  { id: "heiseyoumo", name: "黑色幽默", english: "Black Humor" },
  { id: "weiliangubao", name: "威廉古堡", english: "William's Castle" },
];

export function getJayChouSongList(): TrackInfo[] {
  const seen = new Set<string>();
  return JAY_CHOU_SONGS.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });
}
