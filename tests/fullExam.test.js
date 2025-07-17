/**
 * 完全試験（60問）のE2Eテスト
 */

// 必要なテストヘルパーを読み込み
require('./testHelpers');

// シンプルなアプリケーション用テストクラス
class FullTestApp {
    constructor() {
        this.allYearsData = null;
        this.selectedYear = null;
        this.currentExamManager = null;
        this.correctAnswersDB = {};
    }

    recordCorrectAnswer(year, questionId) {
        if (!this.correctAnswersDB[year]) {
            this.correctAnswersDB[year] = [];
        }
        if (!this.correctAnswersDB[year].includes(questionId)) {
            this.correctAnswersDB[year].push(questionId);
        }
    }

    removeWrongAnswer(year, questionId) {
        if (this.correctAnswersDB[year]) {
            this.correctAnswersDB[year] = this.correctAnswersDB[year].filter(id => id !== questionId);
        }
    }

    calculateSelectionCountForAllQuestions() {
        const result = {};
        if (this.allYearsData?.data?.[this.selectedYear]?.questions) {
            Object.values(this.allYearsData.data[this.selectedYear].questions).forEach(q => {
                result[q.id] = q.selectCount || 2;
            });
        }
        return result;
    }
}

// 60問の完全なモックデータを作成
function createFullMockData() {
    const questions = {};
    const careAnswers = {};
    const healthAnswers = {};
    
    // 介護支援分野（問題1-25）
    for (let i = 1; i <= 25; i++) {
        questions[i] = {
            id: i,
            questionText: `介護支援分野 テスト問題${i}`,
            choices: ["選択肢1", "選択肢2", "選択肢3", "選択肢4", "選択肢5"],
            field: "care_support",
            selectCount: i % 2 === 0 ? 3 : 2 // 偶数問題は3択、奇数問題は2択
        };
        
        // 正答を設定（偶数問題は3つ、奇数問題は2つ）
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
            questionText: `保健医療福祉サービス分野 テスト問題${i}`,
            choices: ["選択肢1", "選択肢2", "選択肢3", "選択肢4", "選択肢5"],
            field: "health_welfare_service",
            selectCount: i % 3 === 0 ? 3 : 2 // 3の倍数問題は3択、それ以外は2択
        };
        
        // 正答を設定
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

// 完全なExamManagerWithJudgmentモック
class FullMockExamManager {
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
    }

    finishExam() {
        this.endTime = new Date();
        const timeTaken = Math.floor((this.endTime - this.startTime) / 1000 / 60); // 分
        
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
        
        return {
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

    renderResults(results) {
        const passedClass = results.judgment.passed ? 'passed' : 'failed';
        
        return `
            <div class="results-container">
                <div class="results-header">
                    <h2>🎓 試験結果</h2>
                    <p>${results.examInfo.year} ${results.examInfo.title}</p>
                </div>
                
                <div class="overall-judgment ${passedClass}">
                    <h3>${results.judgment.passed ? '✅ 合格' : '❌ 不合格'}</h3>
                    <p>${results.judgment.message}</p>
                </div>
                
                <div class="section-results">
                    <h4>📊 分野別結果</h4>
                    ${results.sectionResults.map(section => `
                        <div class="section-result ${section.passed ? 'passed' : 'failed'}">
                            <h5>${section.section}</h5>
                            <p>得点: ${section.score}/${section.total}問 (${section.percentage}%)</p>
                            <p>合格基準: ${section.passingScore}問以上</p>
                        </div>
                    `).join('')}
                </div>
                
                <div class="statistics">
                    <h4>📈 統計情報</h4>
                    <p>回答数: ${results.statistics.answeredQuestions}/${results.statistics.totalQuestions}問</p>
                    <p>所要時間: ${results.statistics.timeTaken}分</p>
                    <p>完答率: ${results.statistics.completionRate}%</p>
                    <p>正解数: ${results.statistics.totalCorrect}問</p>
                </div>
            </div>
        `;
    }
}

describe('完全試験（60問）E2Eテスト', () => {
    let app, examManager;
    let fullMockData;

    beforeEach(() => {
        // 60問の完全なモックデータを作成
        fullMockData = createFullMockData();
        
        // DOM環境をセットアップ
        document.body.innerHTML = `
            <div class="container">
                <div id="year-selection"></div>
                <div id="mode-selection"></div>
                <div id="question-interface" style="display: none;">
                    <div id="question-content"></div>
                    <div id="navigation-buttons"></div>
                </div>
                <div id="results-display" style="display: none;"></div>
                <div id="statistics-display"></div>
            </div>
        `;

        // アプリを初期化
        app = new FullTestApp();
        app.allYearsData = { data: fullMockData };
        app.selectedYear = 'r6';
        
        // 完全なExamManagerを設定
        examManager = new FullMockExamManager(fullMockData.r6, 'r6');
        app.currentExamManager = examManager;
    });

    describe('完全試験の基本流れ', () => {
        test('60問の問題データが正しく読み込まれる', () => {
            expect(examManager.questionList).toHaveLength(60);
            
            // 介護支援分野（1-25問）
            const careQuestions = examManager.questionList.filter(q => q.field === 'care_support');
            expect(careQuestions).toHaveLength(25);
            
            // 保健医療福祉サービス分野（26-60問）
            const healthQuestions = examManager.questionList.filter(q => q.field === 'health_welfare_service');
            expect(healthQuestions).toHaveLength(35);
        });

        test('試験開始から終了まで正常に動作する', () => {
            // 1. 試験開始
            examManager.startExam();
            expect(examManager.currentQuestionIndex).toBe(0);
            expect(examManager.userAnswers.size).toBe(0);
            expect(examManager.startTime).toBeInstanceOf(Date);

            // 2. 最初の問題確認
            const firstQuestion = examManager.getCurrentQuestion();
            expect(firstQuestion.id).toBe(1);
            expect(firstQuestion.field).toBe('care_support');

            // 3. 問題間の移動
            expect(examManager.nextQuestion()).toBe(true);
            expect(examManager.currentQuestionIndex).toBe(1);
            
            expect(examManager.previousQuestion()).toBe(true);
            expect(examManager.currentQuestionIndex).toBe(0);

            // 4. 試験終了
            const results = examManager.finishExam();
            expect(results).toHaveProperty('examInfo');
            expect(results).toHaveProperty('judgment');
            expect(results).toHaveProperty('sectionResults');
            expect(results).toHaveProperty('statistics');
        });
    });

    describe('採点と合格判定', () => {
        test('全問正解の場合は合格となる', () => {
            examManager.startExam();
            
            // 全問に正解を設定
            examManager.questionList.forEach(question => {
                const correctAnswer = examManager.getCorrectAnswer(question.id);
                examManager.setUserAnswer(question.id, correctAnswer);
            });
            
            const results = examManager.finishExam();
            
            expect(results.judgment.passed).toBe(true);
            expect(results.statistics.totalCorrect).toBe(60);
            expect(results.sectionResults[0].passed).toBe(true); // 介護支援分野
            expect(results.sectionResults[1].passed).toBe(true); // 保健医療福祉サービス分野
        });

        test('基準点ぎりぎりの場合の合格判定', () => {
            examManager.startExam();
            
            // 介護支援分野: 13問正解（ぎりぎり合格）
            for (let i = 1; i <= 13; i++) {
                const correctAnswer = examManager.getCorrectAnswer(i);
                examManager.setUserAnswer(i, correctAnswer);
            }
            // 14-25問は不正解（空回答）
            
            // 保健医療福祉サービス分野: 22問正解（ぎりぎり合格）
            for (let i = 26; i <= 47; i++) {
                const correctAnswer = examManager.getCorrectAnswer(i);
                examManager.setUserAnswer(i, correctAnswer);
            }
            // 48-60問は不正解（空回答）
            
            const results = examManager.finishExam();
            
            expect(results.judgment.passed).toBe(true);
            expect(results.sectionResults[0].score).toBe(13);
            expect(results.sectionResults[0].passed).toBe(true);
            expect(results.sectionResults[1].score).toBe(22);
            expect(results.sectionResults[1].passed).toBe(true);
        });

        test('一分野不合格の場合は全体も不合格となる', () => {
            examManager.startExam();
            
            // 介護支援分野: 12問正解（不合格）
            for (let i = 1; i <= 12; i++) {
                const correctAnswer = examManager.getCorrectAnswer(i);
                examManager.setUserAnswer(i, correctAnswer);
            }
            
            // 保健医療福祉サービス分野: 35問全問正解
            for (let i = 26; i <= 60; i++) {
                const correctAnswer = examManager.getCorrectAnswer(i);
                examManager.setUserAnswer(i, correctAnswer);
            }
            
            const results = examManager.finishExam();
            
            expect(results.judgment.passed).toBe(false);
            expect(results.sectionResults[0].passed).toBe(false); // 介護支援分野不合格
            expect(results.sectionResults[1].passed).toBe(true);  // 保健医療福祉サービス分野合格
        });
    });

    describe('統計情報の正確性', () => {
        test('統計データが正しく計算される', () => {
            examManager.startExam();
            
            // 30問だけ回答（半分）
            for (let i = 1; i <= 30; i++) {
                const correctAnswer = examManager.getCorrectAnswer(i);
                examManager.setUserAnswer(i, correctAnswer);
            }
            
            const results = examManager.finishExam();
            
            expect(results.statistics.answeredQuestions).toBe(30);
            expect(results.statistics.totalQuestions).toBe(60);
            expect(results.statistics.completionRate).toBe(50);
            expect(results.statistics.totalCorrect).toBe(30);
            expect(results.statistics.wrongAnswers).toBe(30); // 未回答も間違いとしてカウント
        });

        test('所要時間が記録される', async () => {
            examManager.startExam();
            
            // 少し時間を経過させる
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const results = examManager.finishExam();
            
            expect(results.statistics.timeTaken).toBeGreaterThanOrEqual(0);
            expect(typeof results.statistics.timeTaken).toBe('number');
        });
    });

    describe('結果表示', () => {
        test('結果HTMLが正しく生成される', () => {
            examManager.startExam();
            
            // いくつかの問題に回答
            for (let i = 1; i <= 20; i++) {
                const correctAnswer = examManager.getCorrectAnswer(i);
                examManager.setUserAnswer(i, correctAnswer);
            }
            
            const results = examManager.finishExam();
            const html = examManager.renderResults(results);
            
            expect(html).toContain('試験結果');
            expect(html).toContain('介護支援分野');
            expect(html).toContain('保健医療福祉サービス分野');
            expect(html).toContain('統計情報');
            expect(html).toContain('回答数:');
            expect(html).toContain('所要時間:');
        });
    });
});
