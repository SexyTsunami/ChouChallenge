/**
 * Curated Jay Chou discography for trivia choices.
 * YouTube video IDs are resolved at runtime via search (cached in youtube.ts).
 */
export const JAY_CHOU_SONGS: { id: string; name: string }[] = [
  { id: "qinghuaci", name: "青花瓷" },
  { id: "daoxiang", name: "稻香" },
  { id: "yequ", name: "夜曲" },
  { id: "qilixiang", name: "七里香" },
  { id: "qingtian", name: "晴天" },
  { id: "juhua", name: "菊花台" },
  { id: "dongfengpo", name: "东风破" },
  { id: "faxue", name: "发如雪" },
  { id: "hongchen", name: "红尘客栈" },
  { id: "yanhuayileng", name: "烟花易冷" },
  { id: "shuangjiegun", name: "双节棍" },
  { id: "jian", name: "简单爱" },
  { id: "tingmama", name: "听妈妈的话" },
  { id: "geqi", name: "搁浅" },
  { id: "mojiezuo", name: "牛仔很忙" },
  { id: "yuanxiaojie", name: "园游会" },
  { id: "anhao", name: "暗号" },
  { id: "fanfangxiang", name: "反方向的钟" },
  { id: "aiya", name: "爱在西元前" },
  { id: "longjuan", name: "龙卷风" },
  { id: "xingqing", name: "星晴" },
  { id: "mojie", name: "默" },
  { id: "shuai", name: "退后" },
  { id: "huahai", name: "花海" },
  { id: "shuohaobuku", name: "说好不哭" },
  { id: "mojiezuoshuo", name: "不能说的秘密" },
  { id: "qianlizhiwai", name: "千里之外" },
  { id: "piano", name: "枫" },
  { id: "xiangsi", name: "一路向北" },
  { id: "jiangnan", name: "江南" },
  { id: "yanhuasui", name: "烟花" },
  { id: "minzufeng", name: "本草纲目" },
  { id: "zuiweida", name: "最伟大的作品" },
];

export function getJayChouSongList(): { id: string; name: string }[] {
  const seen = new Set<string>();
  return JAY_CHOU_SONGS.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });
}
