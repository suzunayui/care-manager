/**
 * 共通のテストヘルパーとモック関数
 */

// DataLoaderのモッククラス
class MockDataLoader {
    constructor() {
        this.yearInfoMap = {
            'r2': { name: '令和2年', year: 'r2', examNumber: 23, hasPassingCriteria: true },
            'r3': { name: '令和3年', year: 'r3', examNumber: 24, hasPassingCriteria: true },
            'r4': { name: '令和4年', year: 'r4', examNumber: 25, hasPassingCriteria: true },
            'r5': { name: '令和5年', year: 'r5', examNumber: 26, hasPassingCriteria: true },
            'r6': { name: '令和6年', year: 'r6', examNumber: 27, hasPassingCriteria: true }
        };
    }

    async loadAllYearsData() {
        return { data: global.mockQuestionData };
    }

    getYearInfo(year) {
        return this.yearInfoMap[year] || null;
    }

    getAllYearInfo() {
        return Object.values(this.yearInfoMap);
    }
}

// UIRendererのモッククラス
class MockUIRenderer {
    constructor() {}
    
    showLoading() {}
    hideLoading() {}
    showScreen(screenId) {}
    hideAllScreens() {}
    showError(message) {}
    showSuccess(message) {}
}

// ExamManagerWithJudgmentのモッククラス
class MockExamManagerWithJudgment {
    constructor(yearData, selectedYear) {
        this.yearData = yearData;
        this.selectedYear = selectedYear;
        this.questionList = Object.values(yearData.questions || {});
        this.currentQuestionIndex = 0;
        this.userAnswers = new Map();
    }

    startExam() {
        this.currentQuestionIndex = 0;
        this.userAnswers.clear();
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

    getAllQuestions() {
        return this.questionList;
    }

    finishExam() {
        return {
            examInfo: { year: this.selectedYear, title: 'テスト試験' },
            judgment: { passed: true, message: 'テスト合格' },
            sectionResults: [],
            statistics: {
                answeredQuestions: this.userAnswers.size,
                totalQuestions: this.questionList.length,
                timeTaken: 30,
                completionRate: 100,
                wrongAnswers: 0
            }
        };
    }

    renderResults(results) {
        return '<div>テスト結果</div>';
    }
}

// グローバルにモッククラスを設定
global.DataLoader = MockDataLoader;
global.UIRenderer = MockUIRenderer;
global.ExamManagerWithJudgment = MockExamManagerWithJudgment;

module.exports = {
    MockDataLoader,
    MockUIRenderer,
    MockExamManagerWithJudgment
};
