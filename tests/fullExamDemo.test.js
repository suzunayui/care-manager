/**
 * 60問試験の実際の解答デモンストレーション
 */

// 必要なテストヘルパーを読み込み
require('./testHelpers');

// 完全なExamManagerWithJudgmentモック（結果表示機能付き）
class DemoExamManager {
    constructor(yearData, selectedYear) {
        this.yearData = yearData;
        this.selectedYear = selectedYear;
        this.questionList = Object.values(yearData.questions || {});
        this.currentQuestionIndex = 0;
        this.userAnswers = new Map();
        this.startTime = null;
        this.endTime = null;
    }

    startExam() {
        this.currentQuestionIndex = 0;
        this.userAnswers.clear();
        this.startTime = new Date();
        console.log(`🎯 ${this.selectedYear}年度 介護支援専門員実務研修受講試験を開始します`);
        console.log(`📝 全${this.questionList.length}問の試験です\n`);
    }

    getCurrentQuestion() {
        return this.questionList[this.currentQuestionIndex] || null;
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questionList.length - 1) {
            this.currentQuestionIndex++;
            return true;
        }
        return false;
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            return true;
        }
        return false;
    }

    setUserAnswer(questionId, answers) {
        this.userAnswers.set(questionId, answers);
        const question = this.questionList.find(q => q.id === questionId);
        if (question) {
            console.log(`✏️  問題${questionId}(${question.field === 'care_support' ? '介護支援' : '保健医療福祉'}) - 回答: [${answers.join(', ')}]`);
        }
    }

    finishExam() {
        this.endTime = new Date();
        const timeTaken = Math.floor((this.endTime - this.startTime) / 1000 / 60); // 分
        
        console.log('\n🔍 採点中...\n');
        
        // 採点処理
        const careQuestions = this.questionList.filter(q => q.field === 'care_support');
        const healthQuestions = this.questionList.filter(q => q.field === 'health_welfare_service');
        
        let careCorrect = 0;
        let healthCorrect = 0;
        let totalCorrect = 0;
        
        // 介護支援分野の採点
        careQuestions.forEach(q => {
            const userAnswer = this.userAnswers.get(q.id) || [];
            const correctAnswer = this.getCorrectAnswer(q.id);
            if (this.checkAnswerMatch(correctAnswer, userAnswer)) {
                careCorrect++;
                totalCorrect++;
            }
        });
        
        // 保健医療福祉サービス分野の採点
        healthQuestions.forEach(q => {
            const userAnswer = this.userAnswers.get(q.id) || [];
            const correctAnswer = this.getCorrectAnswer(q.id);
            if (this.checkAnswerMatch(correctAnswer, userAnswer)) {
                healthCorrect++;
                totalCorrect++;
            }
        });
        
        // 合格判定
        const carePassingScore = 13; // 25問中13問以上
        const healthPassingScore = 22; // 35問中22問以上
        const carePassed = careCorrect >= carePassingScore;
        const healthPassed = healthCorrect >= healthPassingScore;
        const overallPassed = carePassed && healthPassed;
        
        const results = {
            examInfo: {
                year: this.selectedYear,
                title: '介護支援専門員実務研修受講試験'
            },
            judgment: {
                passed: overallPassed,
                message: overallPassed ? 
                    '🎉 合格おめでとうございます！' : 
                    '📚 不合格です。もう一度勉強して挑戦しましょう。'
            },
            sectionResults: [
                {
                    section: '介護支援分野',
                    score: careCorrect,
                    total: careQuestions.length,
                    percentage: Math.round((careCorrect / careQuestions.length) * 100),
                    passingScore: carePassingScore,
                    passed: carePassed
                },
                {
                    section: '保健医療福祉サービス分野',
                    score: healthCorrect,
                    total: healthQuestions.length,
                    percentage: Math.round((healthCorrect / healthQuestions.length) * 100),
                    passingScore: healthPassingScore,
                    passed: healthPassed
                }
            ],
            statistics: {
                answeredQuestions: this.userAnswers.size,
                totalQuestions: this.questionList.length,
                timeTaken: timeTaken,
                completionRate: Math.round((this.userAnswers.size / this.questionList.length) * 100),
                wrongAnswers: this.questionList.length - totalCorrect,
                totalCorrect: totalCorrect
            }
        };
        
        this.displayResults(results);
        return results;
    }

    displayResults(results) {
        console.log('📊 ===== 試験結果 =====');
        console.log(`📝 ${results.examInfo.year} ${results.examInfo.title}`);
        console.log('');
        
        // 総合判定
        const passIcon = results.judgment.passed ? '✅' : '❌';
        console.log(`${passIcon} 総合判定: ${results.judgment.passed ? '合格' : '不合格'}`);
        console.log(`   ${results.judgment.message}`);
        console.log('');
        
        // 分野別結果
        console.log('📈 分野別結果:');
        results.sectionResults.forEach(section => {
            const sectionIcon = section.passed ? '✅' : '❌';
            console.log(`${sectionIcon} ${section.section}`);
            console.log(`   得点: ${section.score}/${section.total}問 (${section.percentage}%)`);
            console.log(`   合格基準: ${section.passingScore}問以上 ${section.passed ? '(達成)' : '(未達成)'}`);
            console.log('');
        });
        
        // 統計情報
        console.log('📊 統計情報:');
        console.log(`   回答数: ${results.statistics.answeredQuestions}/${results.statistics.totalQuestions}問`);
        console.log(`   所要時間: ${results.statistics.timeTaken}分`);
        console.log(`   完答率: ${results.statistics.completionRate}%`);
        console.log(`   正解数: ${results.statistics.totalCorrect}問`);
        console.log(`   不正解数: ${results.statistics.wrongAnswers}問`);
        console.log('');
        console.log('🎯 ===== 試験終了 =====');
    }

    getCorrectAnswer(questionId) {
        const answers = this.yearData.answers;
        if (questionId >= 1 && questionId <= 25) {
            return answers.care_support_field?.[questionId.toString()] || [];
        } else if (questionId >= 26 && questionId <= 60) {
            return answers.health_welfare_service_field?.[questionId.toString()] || [];
        }
        return [];
    }

    checkAnswerMatch(correctAnswers, userAnswers) {
        if (!correctAnswers || !userAnswers) return false;
        if (!Array.isArray(correctAnswers) || !Array.isArray(userAnswers)) return false;
        
        const correctSet = new Set(correctAnswers);
        const userSet = new Set(userAnswers);
        
        if (correctSet.size !== userSet.size) return false;
        
        for (const answer of correctSet) {
            if (!userSet.has(answer)) return false;
        }
        
        return true;
    }
}

// 60問の完全なモックデータを作成
function createDemoMockData() {
    const questions = {};
    const careAnswers = {};
    const healthAnswers = {};
    
    // 介護支援分野（問題1-25）
    for (let i = 1; i <= 25; i++) {
        questions[i] = {
            id: i,
            questionText: `介護支援分野 問題${i}: 介護支援専門員の業務に関する問題です。`,
            choices: [
                "介護保険法に基づく業務を行う",
                "利用者の自立支援を重視する", 
                "地域包括ケアシステムを理解する",
                "多職種との連携を図る",
                "継続的な研修を受ける"
            ],
            field: "care_support",
            selectCount: i % 2 === 0 ? 3 : 2
        };
        
        if (i % 2 === 0) {
            careAnswers[i.toString()] = [1, 3, 5];
        } else {
            careAnswers[i.toString()] = [2, 4];
        }
    }
    
    // 保健医療福祉サービス分野（問題26-60）
    for (let i = 26; i <= 60; i++) {
        questions[i] = {
            id: i,
            questionText: `保健医療福祉サービス分野 問題${i}: 保健医療福祉サービスに関する問題です。`,
            choices: [
                "在宅サービスの提供",
                "施設サービスの利用",
                "地域密着型サービスの活用", 
                "予防給付の実施",
                "医療との連携"
            ],
            field: "health_welfare_service",
            selectCount: i % 3 === 0 ? 3 : 2
        };
        
        if (i % 3 === 0) {
            healthAnswers[i.toString()] = [1, 2, 4];
        } else {
            healthAnswers[i.toString()] = [3, 5];
        }
    }
    
    return {
        r6: {
            questions: questions,
            answers: {
                care_support_field: careAnswers,
                health_welfare_service_field: healthAnswers
            }
        }
    };
}

describe('60問完全試験デモンストレーション', () => {
    let examManager;
    let mockData;

    beforeEach(() => {
        mockData = createDemoMockData();
        examManager = new DemoExamManager(mockData.r6, 'r6');
    });

    test('60問を解いて結果を確認する完全デモ', async () => {
        // 1. 試験開始
        examManager.startExam();
        expect(examManager.currentQuestionIndex).toBe(0);
        expect(examManager.userAnswers.size).toBe(0);
        
        // 2. 全60問に回答（様々なパターンで回答）
        console.log('📚 回答開始...');
        
        // 介護支援分野（1-25問）- 80%の正答率で回答
        for (let i = 1; i <= 25; i++) {
            let userAnswer;
            if (i <= 20) { // 最初の20問は正解
                userAnswer = examManager.getCorrectAnswer(i);
            } else { // 残り5問は不正解
                const correctAnswer = examManager.getCorrectAnswer(i);
                const selectCount = examManager.questionList.find(q => q.id === i).selectCount;
                
                // 正解とは違う選択肢を選ぶ
                userAnswer = [];
                for (let j = 1; j <= selectCount; j++) {
                    if (!correctAnswer.includes(j)) {
                        userAnswer.push(j);
                        if (userAnswer.length >= selectCount) break;
                    }
                }
                if (userAnswer.length < selectCount) {
                    userAnswer.push(correctAnswer[0]); // 足りない場合は正解の一部を混ぜる
                }
            }
            
            examManager.setUserAnswer(i, userAnswer);
        }
        
        // 保健医療福祉サービス分野（26-60問）- 70%の正答率で回答
        for (let i = 26; i <= 60; i++) {
            let userAnswer;
            if (i <= 50) { // 最初の25問は正解
                userAnswer = examManager.getCorrectAnswer(i);
            } else { // 残り10問は不正解
                const correctAnswer = examManager.getCorrectAnswer(i);
                const selectCount = examManager.questionList.find(q => q.id === i).selectCount;
                
                // 正解とは違う選択肢を選ぶ
                userAnswer = [];
                for (let j = 1; j <= selectCount; j++) {
                    if (!correctAnswer.includes(j)) {
                        userAnswer.push(j);
                        if (userAnswer.length >= selectCount) break;
                    }
                }
                if (userAnswer.length < selectCount) {
                    userAnswer.push(correctAnswer[0]);
                }
            }
            
            examManager.setUserAnswer(i, userAnswer);
        }
        
        // 3. 試験終了と結果表示
        console.log('\n⏰ 試験時間終了！');
        const results = examManager.finishExam();
        
        // 4. 結果の検証
        expect(results).toHaveProperty('examInfo');
        expect(results).toHaveProperty('judgment');
        expect(results).toHaveProperty('sectionResults');
        expect(results).toHaveProperty('statistics');
        
        expect(results.examInfo.year).toBe('r6');
        expect(results.statistics.answeredQuestions).toBe(60);
        expect(results.statistics.totalQuestions).toBe(60);
        expect(results.statistics.completionRate).toBe(100);
        
        // 分野別結果の確認
        expect(results.sectionResults).toHaveLength(2);
        expect(results.sectionResults[0].section).toBe('介護支援分野');
        expect(results.sectionResults[1].section).toBe('保健医療福祉サービス分野');
        
        // 合格判定の確認（80%と70%の正答率なので合格するはず）
        expect(results.sectionResults[0].score).toBe(20); // 介護支援分野: 20/25問正解
        expect(results.sectionResults[1].score).toBe(25); // 保健医療福祉: 25/35問正解
        expect(results.judgment.passed).toBe(true);
        
        console.log('\n🎉 デモンストレーション完了！');
    }, 10000); // タイムアウトを10秒に設定
    
    test('不合格ケースのデモ', () => {
        examManager.startExam();
        
        // 介護支援分野で基準点を下回る回答（12問正解）
        for (let i = 1; i <= 12; i++) {
            const correctAnswer = examManager.getCorrectAnswer(i);
            examManager.setUserAnswer(i, correctAnswer);
        }
        
        // 保健医療福祉サービス分野は満点
        for (let i = 26; i <= 60; i++) {
            const correctAnswer = examManager.getCorrectAnswer(i);
            examManager.setUserAnswer(i, correctAnswer);
        }
        
        const results = examManager.finishExam();
        
        expect(results.judgment.passed).toBe(false);
        expect(results.sectionResults[0].passed).toBe(false); // 介護支援分野不合格
        expect(results.sectionResults[1].passed).toBe(true);  // 保健医療福祉分野合格
        
        console.log('\n📚 一分野でも基準点を下回ると不合格となります');
    });
});
