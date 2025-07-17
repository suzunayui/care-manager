/**
 * E2E（エンドツーエンド）テスト用の統合テスト
 */

// 最小限のExamControllerクラスのテスト用実装
class TestExamController {
    constructor(app) {
        this.app = app;
    }

    checkAnswerMatch(correctAnswers, userAnswers) {
        if (!correctAnswers || !userAnswers) {
            return false;
        }
        
        if (!Array.isArray(correctAnswers) || !Array.isArray(userAnswers)) {
            return false;
        }
        
        const correctSet = new Set(correctAnswers);
        const userSet = new Set(userAnswers);
        
        if (correctSet.size !== userSet.size) {
            return false;
        }
        
        for (const answer of correctSet) {
            if (!userSet.has(answer)) {
                return false;
            }
        }
        
        return true;
    }

    getCorrectAnswersForQuestion(questionId) {
        const currentYearData = this.app.allYearsData?.data?.[this.app.selectedYear];
        
        if (!currentYearData?.answers) {
            return null;
        }
        
        const answers = currentYearData.answers;
        let result = null;
        
        if (questionId >= 1 && questionId <= 25) {
            result = answers.care_support_field?.[questionId.toString()] || null;
        } else if (questionId >= 26 && questionId <= 60) {
            result = answers.health_welfare_service_field?.[questionId.toString()] || null;
        }
        
        return result;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    startWrongQuestionReview() {
        const wrongAnswersSet = this.app.wrongAnswersDB[this.app.selectedYear] || new Set();
        if (wrongAnswersSet.size === 0) {
            return;
        }
        
        this.app.currentMode = 'review';
        
        // 間違い問題のみのプールを作成
        this.app.randomQuestionPool = this.app.currentExamManager.questionList.filter(q => 
            wrongAnswersSet.has(q.id)
        );
    }
}

// TestExamAppクラス（app.test.jsから共通化）
class TestExamApp {
    constructor() {
        this.allYearsData = null;
        this.currentExamManager = null;
        this.selectedYear = null;
        this.currentMode = null;
        this.wrongAnswersDB = {};
        this.correctAnswersDB = {};
        this.randomQuestionPool = [];
        this.currentRandomIndex = 0;
        this.showingAnswer = false;
        this.tempUserAnswer = [];
        
        this.dataLoader = new DataLoader();
        this.uiRenderer = new UIRenderer();
        this.examController = null;
        this.choiceController = null;
    }

    recordCorrectAnswer(questionId) {
        if (!this.correctAnswersDB[this.selectedYear]) {
            this.correctAnswersDB[this.selectedYear] = new Set();
        }
        this.correctAnswersDB[this.selectedYear].add(questionId);
        if (this.wrongAnswersDB[this.selectedYear]) {
            this.wrongAnswersDB[this.selectedYear].delete(questionId);
        }
    }

    recordWrongAnswer(questionId) {
        if (!this.wrongAnswersDB[this.selectedYear]) {
            this.wrongAnswersDB[this.selectedYear] = new Set();
        }
        this.wrongAnswersDB[this.selectedYear].add(questionId);
        if (this.correctAnswersDB[this.selectedYear]) {
            this.correctAnswersDB[this.selectedYear].delete(questionId);
        }
    }
}

describe('学習システム統合テスト', () => {
    let app, examController;

    beforeEach(() => {
        // 完全なアプリ環境をセットアップ
        document.body.innerHTML = `
            <div class="container">
                <div id="year-selection"></div>
                <div id="mode-selection"></div>
                <div id="question-interface">
                    <div id="question-content"></div>
                    <div id="navigation-buttons"></div>
                </div>
                <div id="results-display"></div>
                <div id="statistics-display"></div>
            </div>
        `;

        app = new TestExamApp();
        app.allYearsData = { data: global.mockQuestionData };
        app.selectedYear = 'r6';
        examController = new TestExamController(app);
        app.examController = examController;
        
        // モックExamManagerを設定
        app.currentExamManager = new ExamManagerWithJudgment(
            global.mockQuestionData.r6, 
            'r6'
        );
    });

    describe('基本的な動作テスト', () => {
        test('ExamControllerが正しく初期化される', () => {
            expect(examController).toBeInstanceOf(TestExamController);
            expect(examController.app).toBe(app);
        });

        test('正答チェックが正しく動作する', () => {
            const correctAnswers = [1, 3];
            const userAnswers1 = [1, 3]; // 正解
            const userAnswers2 = [1, 2]; // 不正解

            expect(examController.checkAnswerMatch(correctAnswers, userAnswers1)).toBe(true);
            expect(examController.checkAnswerMatch(correctAnswers, userAnswers2)).toBe(false);
        });

        test('問題IDから正答を取得できる', () => {
            const correctAnswers1 = examController.getCorrectAnswersForQuestion(1);
            const correctAnswers2 = examController.getCorrectAnswersForQuestion(2);

            expect(correctAnswers1).toEqual([1, 3]);
            expect(correctAnswers2).toEqual([2, 4, 5]);
        });

        test('配列がシャッフルされる', () => {
            const original = [1, 2, 3, 4, 5];
            const toShuffle = [...original];
            
            examController.shuffleArray(toShuffle);
            
            // 長さは変わらない
            expect(toShuffle).toHaveLength(original.length);
            
            // 全ての要素が含まれている
            original.forEach(item => {
                expect(toShuffle).toContain(item);
            });
        });
    });

    describe('学習記録機能', () => {
        test('正解・間違いが正しく記録される', () => {
            // 正解記録
            app.recordCorrectAnswer(1);
            expect(app.correctAnswersDB.r6.has(1)).toBe(true);

            // 間違い記録
            app.recordWrongAnswer(2);
            expect(app.wrongAnswersDB.r6.has(2)).toBe(true);
        });

        test('間違い問題復習モードが動作する', () => {
            // 事前に間違い問題を記録
            app.recordWrongAnswer(1);
            app.recordWrongAnswer(2);

            examController.startWrongQuestionReview();

            expect(app.currentMode).toBe('review');
            expect(app.randomQuestionPool).toHaveLength(2);
        });
    });
});
