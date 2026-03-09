export type Quote = {
  text: string
  character: string
  series: string
}

export const QUOTES: Quote[] = [
  // Death Note - L
  {
    text: "正義は必ず勝つ。なぜならば、勝った方が正義だからです",
    character: "エル",
    series: "DEATH NOTE",
  },
  {
    text: "私はLです",
    character: "エル",
    series: "DEATH NOTE",
  },
  {
    text: "このノートに名前を書かれた人間は死ぬ",
    character: "リューク",
    series: "DEATH NOTE",
  },
  // 斉木楠雄のΨ難
  {
    text: "やれやれ",
    character: "斉木楠雄",
    series: "斉木楠雄のΨ難",
  },
  {
    text: "僕は平穏な生活が送りたいだけなんだ",
    character: "斉木楠雄",
    series: "斉木楠雄のΨ難",
  },
  {
    text: "勘違いするな。助けたわけじゃない",
    character: "斉木楠雄",
    series: "斉木楠雄のΨ難",
  },
  // 葬送のフリーレン
  {
    text: "人間の寿命は短いね",
    character: "フリーレン",
    series: "葬送のフリーレン",
  },
  {
    text: "人を知ろうとすることが、魔法よりずっと大切だった",
    character: "フリーレン",
    series: "葬送のフリーレン",
  },
  {
    text: "もっと知ろうとするべきだった",
    character: "フリーレン",
    series: "葬送のフリーレン",
  },
  // 文豪ストレイドッグス - 江戸川乱歩
  {
    text: "推理に不可能の文字はないのだよ",
    character: "江戸川乱歩",
    series: "文豪ストレイドッグス",
  },
  {
    text: "僕は世界一の名探偵なんだから",
    character: "江戸川乱歩",
    series: "文豪ストレイドッグス",
  },
  {
    text: "真実はいつもひとつ…じゃなくて、僕の前にある",
    character: "江戸川乱歩",
    series: "文豪ストレイドッグス",
  },
  // 文豪ストレイドッグス - 太宰治
  {
    text: "人は自分を救済する為に生きているんだよ",
    character: "太宰治",
    series: "文豪ストレイドッグス",
  },
  {
    text: "自殺の美学とは、つまり生きる美学なのさ",
    character: "太宰治",
    series: "文豪ストレイドッグス",
  },
  {
    text: "君なら人を救う側になれる",
    character: "太宰治",
    series: "文豪ストレイドッグス",
  },
  {
    text: "闇の中にこそ光がある。それを忘れちゃいけないよ",
    character: "太宰治",
    series: "文豪ストレイドッグス",
  },
  // ひゃくエム
  {
    text: "浅く考えろ 世の中舐めろ",
    character: "財津凛太朗",
    series: "ひゃくエム。",
  },
]

export function getRandomQuote(): Quote {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]
}
