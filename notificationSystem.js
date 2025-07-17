/**
 * 通知システム - alertとconfirmの代替
 */
class NotificationSystem {
    constructor() {
        this.createNotificationContainer();
    }

    /**
     * 通知コンテナを作成
     */
    createNotificationContainer() {
        // 通知用のコンテナがない場合は作成
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    }

    /**
     * 情報通知を表示
     */
    showInfo(message, duration = 4000) {
        this.showNotification(message, 'info', duration);
    }

    /**
     * 成功通知を表示
     */
    showSuccess(message, duration = 4000) {
        this.showNotification(message, 'success', duration);
    }

    /**
     * 警告通知を表示
     */
    showWarning(message, duration = 5000) {
        this.showNotification(message, 'warning', duration);
    }

    /**
     * エラー通知を表示
     */
    showError(message, duration = 6000) {
        this.showNotification(message, 'error', duration);
    }

    /**
     * 基本的な通知を表示
     */
    showNotification(message, type = 'info', duration = 4000) {
        const container = document.getElementById('notification-container');
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // アイコンを選択
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type]}</span>
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        container.appendChild(notification);

        // アニメーション
        setTimeout(() => {
            notification.classList.add('notification-show');
        }, 10);

        // 自動削除
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }

        return notification;
    }

    /**
     * 確認ダイアログを表示
     */
    showConfirm(message, title = '確認') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            
            const modal = document.createElement('div');
            modal.className = 'confirmation-modal';
            
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                    </div>
                    <div class="modal-body">
                        <p>${message.replace(/\n/g, '<br>')}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn modal-btn-cancel">キャンセル</button>
                        <button class="modal-btn modal-btn-confirm">OK</button>
                    </div>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // イベントリスナー
            const cancelBtn = modal.querySelector('.modal-btn-cancel');
            const confirmBtn = modal.querySelector('.modal-btn-confirm');

            const cleanup = () => {
                overlay.remove();
            };

            cancelBtn.onclick = () => {
                cleanup();
                resolve(false);
            };

            confirmBtn.onclick = () => {
                cleanup();
                resolve(true);
            };

            // ESCキーで閉じる
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                    document.removeEventListener('keydown', handleKeyDown);
                }
            };
            document.addEventListener('keydown', handleKeyDown);

            // アニメーション
            setTimeout(() => {
                overlay.classList.add('modal-show');
            }, 10);
        });
    }

    /**
     * 通知を削除
     */
    removeNotification(notification) {
        notification.classList.add('notification-hide');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }

    /**
     * 全ての通知を削除
     */
    clearAll() {
        const container = document.getElementById('notification-container');
        if (container) {
            container.innerHTML = '';
        }
    }
}

// グローバルインスタンス
window.notificationSystem = new NotificationSystem();
