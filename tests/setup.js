// テスト環境のセットアップ
require('@testing-library/jest-dom');

// テストヘルパーを読み込み
require('./testHelpers');

// DOMの基本構造をモック
document.body.innerHTML = `
    <div class="container">
        <div id="year-selection" style="display: none;"></div>
        <div id="mode-selection" style="display: none;"></div>
        <div id="question-interface" style="display: none;">
            <div id="question-content"></div>
            <div id="navigation-buttons"></div>
        </div>
        <div id="results-display" style="display: none;"></div>
        <div id="statistics-display" style="display: none;"></div>
        <div id="loading" style="display: none;"></div>
    </div>
`;

// グローバル関数のモック
global.toggleChoice = jest.fn();
global.notificationSystem = {
    showError: jest.fn(),
    showWarning: jest.fn(),
    showSuccess: jest.fn(),
    showConfirm: jest.fn().mockResolvedValue(true)
};

// LocalStorageのモック
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock;

// モックデータ
global.mockQuestionData = {
    r6: {
        questions: {
            1: {
                id: 1,
                questionText: "テスト問題1",
                choices: ["選択肢1", "選択肢2", "選択肢3", "選択肢4", "選択肢5"],
                field: "care_support",
                selectCount: 2
            },
            2: {
                id: 2,
                questionText: "テスト問題2",
                choices: ["選択肢1", "選択肢2", "選択肢3", "選択肢4", "選択肢5"],
                field: "care_support",
                selectCount: 3
            }
        },
        answers: {
            care_support_field: {
                "1": [1, 3],
                "2": [2, 4, 5]
            },
            health_welfare_service_field: {}
        }
    }
};
