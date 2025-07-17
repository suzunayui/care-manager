const fs = require('fs');

// r6_questions.jsonファイルを読み込み
const filePath = './r6_questions.json';
let content = fs.readFileSync(filePath, 'utf8');

console.log('半角スペース除去処理を開始します...');

// 選択肢内の不適切な半角スペースを修正
// パターン1: 文の途中での改行による半角スペース（例: "30%を超えて いる" → "30%を超えている"）
content = content.replace(/て\s+いる/g, 'ている');
content = content.replace(/し\s+て/g, 'して');
content = content.replace(/っ\s+た/g, 'った');
content = content.replace(/え\s+ら/g, 'えら');
content = content.replace(/超\s+え/g, '超え');
content = content.replace(/支\s+援/g, '支援');
content = content.replace(/な\s+ら/g, 'なら');
content = content.replace(/制\s+度/g, '制度');
content = content.replace(/分\s+割/g, '分割');
content = content.replace(/相\s+当/g, '相当');
content = content.replace(/賄\s+わ/g, '賄わ');

// パターン2: 単語間の不適切なスペース
content = content.replace(/65歳以上の\s+者/g, '65歳以上の者');
content = content.replace(/要支援・要介護状態になった\s+者/g, '要支援・要介護状態になった者');
content = content.replace(/転出先の市町村の被保険者と\s+なる/g, '転出先の市町村の被保険者となる');
content = content.replace(/定率の利\s+用者負担/g, '定率の利用者負担');
content = content.replace(/3\.\s+割負担/g, '3割負担');
content = content.replace(/介護給付費・地域支援事業支援納付金を納付\s+する/g, '介護給付費・地域支援事業支援納付金を納付する');
content = content.replace(/必要な助言及び適切な援\s+助/g, '必要な助言及び適切な援助');
content = content.replace(/年金保険者を指導・監督しなければな\s+ら/g, '年金保険者を指導・監督しなければなら');
content = content.replace(/都道府県\s+10%/g, '都道府県10%');
content = content.replace(/市町村\s+10%/g, '市町村10%');
content = content.replace(/費用の総額の5%に相当す\s+る額/g, '費用の総額の5%に相当する額');
content = content.replace(/それぞれ50%ずつ\s+賄/g, 'それぞれ50%ずつ賄');

// パターン3: 他の特定パターン
content = content.replace(/減少傾向に\s+ある/g, '減少傾向にある');
content = content.replace(/制度\s+化/g, '制度化');

// バックアップを作成
const backupPath = filePath + '.backup';
if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
}
fs.writeFileSync(backupPath, fs.readFileSync(filePath));
console.log(`バックアップを作成: ${backupPath}`);

// 修正したファイルを保存
fs.writeFileSync(filePath, content);

console.log('半角スペースの除去が完了しました。');
