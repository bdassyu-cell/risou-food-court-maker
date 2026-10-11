# 理想のフードコートメーカー

GitHub Pagesで動作する静的サイト用の公開コピーです。元のReplitプロジェクトは別管理で、このリポジトリの編集はそちらに反映されません。

公開URL: https://bdassyu-cell.github.io/risou-food-court-maker/

## 公開方法

`main` ブランチに変更をpushすると、GitHub Actionsがpnpmでビルドし、GitHub Pagesへ自動デプロイします。リポジトリの Settings → Pages で Build and deployment が GitHub Actions になっていることを確認してください。

## 保存データ

店舗や配置などのデータはブラウザーのlocalStorageに保存されます。サーバーへの送信や利用者間の同期はありません。ブラウザーや端末を変えると保存データは自動では移りません。

## 使用技術

React、Vite、pnpm。APIサーバーなしで動作するフロントエンドです。