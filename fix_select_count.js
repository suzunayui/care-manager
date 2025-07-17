/**
 * answers.jsonの正解数に基づいてquestions.jsonのselect_countを修正するスクリプト
 */

const fs = require('fs');

function fixSelectCount(year) {
    const questionsFile = `r${year}_questions.json`;
    const answersFile = `r${year}_answers.json`;
    
    try {
        // JSONファイルを読み込み
        const questionsData = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));
        const answersData = JSON.parse(fs.readFileSync(answersFile, 'utf8'));
        
        let changes = [];
        
        // questions.jsonの各問題をチェック
        Object.keys(questionsData.questions).forEach(questionId => {
            const question = questionsData.questions[questionId];
            const currentSelectCount = question.select_count;
            
            // 対応する正解を取得
            let correctAnswers = null;
            if (parseInt(questionId) <= 25) {
                correctAnswers = answersData.answers.care_support_field[questionId];
            } else {
                correctAnswers = answersData.answers.health_welfare_service_field[questionId];
            }
            
            if (correctAnswers && Array.isArray(correctAnswers)) {
                const correctSelectCount = correctAnswers.length;
                
                if (currentSelectCount !== correctSelectCount) {
                    console.log(`問題${questionId}: ${currentSelectCount} → ${correctSelectCount} (正解: ${correctAnswers.join(', ')})`);
                    questionsData.questions[questionId].select_count = correctSelectCount;
                    changes.push({
                        questionId,
                        old: currentSelectCount,
                        new: correctSelectCount,
                        answers: correctAnswers
                    });
                }
            }
        });
        
        if (changes.length > 0) {
            // バックアップを作成
            const backupFile = `${questionsFile}.backup`;
            fs.writeFileSync(backupFile, fs.readFileSync(questionsFile));
            console.log(`バックアップを作成: ${backupFile}`);
            
            // 修正したデータを保存
            fs.writeFileSync(questionsFile, JSON.stringify(questionsData, null, 2));
            console.log(`\n${year}年度: ${changes.length}件の修正を適用しました`);
            
            return changes;
        } else {
            console.log(`${year}年度: 修正の必要はありません`);
            return [];
        }
        
    } catch (error) {
        console.error(`${year}年度の処理でエラー:`, error.message);
        return [];
    }
}

// 全年度を処理
const years = [2, 3, 4, 5, 6];
let totalChanges = 0;

console.log('=== select_count 修正スクリプト ===\n');

years.forEach(year => {
    console.log(`--- 令和${year}年度 ---`);
    const changes = fixSelectCount(year);
    totalChanges += changes.length;
    console.log('');
});

console.log(`=== 完了: 総計 ${totalChanges}件の修正 ===`);
