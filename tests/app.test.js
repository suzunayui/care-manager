/**
 * ExamAppクラスのテスト
 */

// 最小限のExamAppクラスのテスト用実装
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

    // 正解問題を記録
    recordCorrectAnswer(questionId) {
        if (!this.correctAnswersDB[this.selectedYear]) {
            this.correctAnswersDB[this.selectedYear] = new Set();
        }
        
        this.correctAnswersDB[this.selectedYear].add(questionId);
        
        // 間違いデータベースからは削除
        if (this.wrongAnswersDB[this.selectedYear]) {
            this.wrongAnswersDB[this.selectedYear].delete(questionId);
        }
    }

    // 間違い問題を記録
    recordWrongAnswer(questionId) {
        if (!this.wrongAnswersDB[this.selectedYear]) {
            this.wrongAnswersDB[this.selectedYear] = new Set();
        }
        
        this.wrongAnswersDB[this.selectedYear].add(questionId);
        
        // 正解データベースからは削除
        if (this.correctAnswersDB[this.selectedYear]) {
            this.correctAnswersDB[this.selectedYear].delete(questionId);
        }
    }

    // 間違い問題を削除
    removeWrongAnswer(questionId) {
        if (this.wrongAnswersDB[this.selectedYear]) {
            this.wrongAnswersDB[this.selectedYear].delete(questionId);
        }
    }

    // 正解問題数を取得
    getCorrectQuestionCount() {
        if (!this.correctAnswersDB[this.selectedYear]) return 0;
        return this.correctAnswersDB[this.selectedYear].size || 0;
    }

    // 間違い問題数を取得
    getWrongQuestionCount() {
        if (!this.wrongAnswersDB[this.selectedYear]) return 0;
        return this.wrongAnswersDB[this.selectedYear].size || 0;
    }

    // 選択数を取得
    getSelectCount(questionId) {
        if (this.allYearsData && this.allYearsData.data[this.selectedYear] && this.allYearsData.data[this.selectedYear].answers) {
            const answersData = this.allYearsData.data[this.selectedYear].answers;
            let correctAnswers = null;
            
            if (questionId <= 25 && answersData.care_support_field) {
                correctAnswers = answersData.care_support_field[questionId.toString()];
            } else if (questionId >= 26 && answersData.health_welfare_service_field) {
                correctAnswers = answersData.health_welfare_service_field[questionId.toString()];
            }
            
            if (correctAnswers && Array.isArray(correctAnswers)) {
                return correctAnswers.length;
            }
        }
        
        return 3; // デフォルト値
    }
}

describe('ExamApp', () => {
    let app;

    beforeEach(() => {
        // 各テスト前にアプリを初期化
        app = new TestExamApp();
        app.allYearsData = { data: global.mockQuestionData };
        app.selectedYear = 'r6';
        
        // モックデータを設定
        jest.clearAllMocks();
    });

    describe('基本機能テスト', () => {
        test('アプリが正しく初期化される', () => {
            expect(app).toBeInstanceOf(TestExamApp);
            expect(app.wrongAnswersDB).toEqual({});
            expect(app.correctAnswersDB).toEqual({});
            expect(app.selectedYear).toBe('r6');
        });

        test('年度選択が正しく設定される', () => {
            app.selectedYear = 'r5';
            expect(app.selectedYear).toBe('r5');
        });
    });

    describe('正解・間違い記録機能', () => {
        test('正解を記録できる', () => {
            app.selectedYear = 'r6';
            app.recordCorrectAnswer(1);
            
            expect(app.correctAnswersDB.r6.has(1)).toBe(true);
            expect(app.getCorrectQuestionCount()).toBe(1);
        });

        test('間違いを記録できる', () => {
            app.selectedYear = 'r6';
            app.recordWrongAnswer(1);
            
            expect(app.wrongAnswersDB.r6.has(1)).toBe(true);
            expect(app.getWrongQuestionCount()).toBe(1);
        });

        test('正解記録時に間違いデータベースから削除される', () => {
            app.selectedYear = 'r6';
            
            // 最初に間違いとして記録
            app.recordWrongAnswer(1);
            expect(app.wrongAnswersDB.r6.has(1)).toBe(true);
            
            // 正解として記録
            app.recordCorrectAnswer(1);
            expect(app.correctAnswersDB.r6.has(1)).toBe(true);
            expect(app.wrongAnswersDB.r6.has(1)).toBe(false);
        });

        test('間違い問題を削除できる', () => {
            app.selectedYear = 'r6';
            app.recordWrongAnswer(1);
            
            expect(app.wrongAnswersDB.r6.has(1)).toBe(true);
            
            app.removeWrongAnswer(1);
            expect(app.wrongAnswersDB.r6.has(1)).toBe(false);
        });
    });

    describe('選択数計算機能', () => {
        test('正答データから選択数を正しく計算する', () => {
            app.selectedYear = 'r6';
            
            // 問題1: 正答が[1,3]なので選択数は2
            const selectCount1 = app.getSelectCount(1);
            expect(selectCount1).toBe(2);
            
            // 問題2: 正答が[2,4,5]なので選択数は3
            const selectCount2 = app.getSelectCount(2);
            expect(selectCount2).toBe(3);
        });

        test('データがない場合はデフォルト値を返す', () => {
            app.selectedYear = 'r6';
            
            // 存在しない問題ID
            const selectCount = app.getSelectCount(999);
            expect(selectCount).toBe(3); // デフォルト値
        });
    });
});
