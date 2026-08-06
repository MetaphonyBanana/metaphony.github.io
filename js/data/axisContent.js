// ── 各軸クリック後のページ構成データ ─────────────
// まだ「軸クリック→カメラステーション遷移」機能自体は未実装(次のステップ)。
// 先に内容だけ確定させておき、実装時にここを参照する。
//
// node の形:
//   { title: string|null, pageUrl: string|null, usesThree?: boolean }
//   title/pageUrl が null のものは内容未定(TBD)。
//
// axis   : 軸そのもの(軸の上に表示するタイトル)。X軸は無し。
// origin : 原点側の点
// end    : 軸の先端側の点

export const AXIS_CONTENT = {
  X: {
    // Xは軸ラベル自体を持たない。原点側と先端側の2点のみ。
    axis: null,
    origin: { title: null, pageUrl: null }, // TBD
    end:    { title: 'The Catcher in the Rye', pageUrl: null },
  },
  Y: {
    axis:   { title: 'Nine Stories', pageUrl: null },
    origin: { title: 'A Perfect Day for Bananafish', pageUrl: null },
    end:    { title: 'Teddy', pageUrl: null, usesThree: true }, // Teddyページはthree.js使用の可能性あり
  },
  Z: {
    // Yと同じ配置(軸・原点・先端の3点)。軸ラベルのみ確定、原点/先端はまだ未定。
    axis:   { title: 'Glass Saga', pageUrl: null },
    origin: { title: null, pageUrl: null },
    end:    { title: null, pageUrl: null },
  },
};
