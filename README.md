# care-manager

介護支援専門員実務研修受講試験（ケアマネ試験） 学習・復習システム

## 概要

このシステムは、介護支援専門員実務研修受講試験（ケアマネ試験）の学習支援を目的としたWebアプリケーションです。過去問題を使った効率的な学習と復習ができる包括的な学習プラットフォームを提供します。

## 主な機能

### 🎯 学習モード
- **完全試験モード**: 本番同様の60問一括回答（制限時間120分）
- **ランダム学習**: 問題をランダムに出題して学習
- **順次学習**: 問題番号順に体系的学習
- **間違い問題復習**: 過去に間違えた問題のみを集中復習

### 📊 分析・評価機能
- **合否判定**: 年度別合格基準による自動判定
- **分野別スコア**: 介護支援分野・保健医療福祉サービス分野別の詳細分析
- **学習統計**: 正答率、間違い傾向、学習進捗の可視化
- **タイムトラッキング**: 問題解答時間の記録・分析

### 📚 対応年度
- 令和2年度（第23回）
- 令和3年度（第24回）
- 令和4年度（第25回）
- 令和5年度（第26回）
- 令和6年度（第27回）

### 💾 データ管理
- **学習記録保存**: ローカルストレージによる学習履歴管理
- **間違い問題DB**: 個人別間違い問題データベース
- **復習効率化**: 苦手問題の自動抽出・重点学習

## 技術仕様

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **データ形式**: JSON形式による問題・解答データ管理
- **テスト**: Jest による自動テスト（単体・統合テスト）
- **開発サーバー**: Live Server / Python HTTP Server対応

## インストール・起動方法

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 開発サーバーの起動
```bash
# Live Serverを使用
npm run dev

# または Python HTTP Serverを使用
npm run serve
```

### 3. ブラウザでアクセス
```
http://localhost:8080
```

## テスト実行

```bash
# 全テスト実行
npm test

# ウォッチモード（開発時）
npm run test:watch

# カバレッジレポート生成
npm run test:coverage
```

## ファイル構成

```
├── index.html              # メインHTML
├── app.js                 # アプリケーション制御
├── examController.js      # 試験実行制御
├── examManagerWithJudgment.js  # 合否判定機能
├── dataLoader.js          # データ読み込み
├── uiRenderer.js          # UI描画
├── choiceController.js    # 選択問題制御
├── style.css             # メインスタイル
├── notification.css      # 通知システムスタイル
├── notificationSystem.js # 通知システム
├── r[2-6]_questions.json # 年度別問題データ
├── r[2-6]_answers.json   # 年度別解答データ
└── tests/                # テストファイル群
```

## 学習方法の推奨

1. **基礎学習**: 順次学習モードで全問題を一通り学習
2. **実践練習**: 完全試験モードで本番形式の練習
3. **弱点克服**: 間違い問題復習モードで苦手分野を集中学習
4. **確認テスト**: ランダム学習で理解度の最終確認

## 開発・貢献

プロジェクトの改善や新機能の追加については、Issueやプルリクエストをお気軽にお送りください。

## データ出典

本システムで使用している過去問題データは、東京都福祉局から公開されている介護支援専門員実務研修受講試験の過去問題を元に作成されています。

### 過去問題データソース

**令和6年度（第27回）ケアマネ試験過去問**
- 問題: https://www.fukushi.metro.tokyo.lg.jp/documents/d/fukushi/r6shikenmondai-pdf
- 正答: https://www.fukushi.metro.tokyo.lg.jp/documents/d/fukushi/r6seitoubangou-pdf

**令和5年度（第26回）ケアマネ試験過去問**
- 問題: https://www.fukushi.metro.tokyo.lg.jp/documents/d/fukushi/r5shikenmondai
- 正答: https://www.fukushi.metro.tokyo.lg.jp/documents/d/fukushi/r5seitoubangou

**令和4年度（第25回）ケアマネ試験過去問**
- 問題: https://www.fukushi.metro.tokyo.lg.jp/documents/d/fukushi/r4shikenmondai
- 正答: https://www.fukushi.metro.tokyo.lg.jp/documents/d/fukushi/r4seitoubangou

**令和3年度（第24回）ケアマネ試験過去問**
- 問題: https://www.fukushi.metro.tokyo.lg.jp/documents/d/fukushi/r3shikenmondai
- 正答: https://www.fukushi.metro.tokyo.lg.jp/documents/d/fukushi/r3seitoubangou

**令和2年度（第23回）ケアマネ試験過去問**
- 問題: https://www.fukushi.metro.tokyo.lg.jp/documents/d/fukushi/r2shikenmondai
- 正答: https://www.fukushi.metro.tokyo.lg.jp/documents/d/fukushi/r2seitoubangou

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は`LICENSE`ファイルをご確認ください。
