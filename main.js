// ==========================================
// タクシー広告LP - JavaScript メインファイル
// CVR最大化を目的とした機能実装
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ==========================================
    // 設定変数
    // ==========================================
    const CONFIG = {
        scrollThreshold: 100,        // スクロール検知の閾値
        animationDelay: 200,         // アニメーション遅延
        urgencyTimerStart: 30,       // 緊急性タイマー（分）
        popupDelay: 45000,          // ポップアップ表示遅延（45秒）
        exitIntentDelay: 2000       // Exit Intent検知遅延
    };
    
    // ==========================================
    // スムーススクロール機能
    // ==========================================
    function initSmoothScroll() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const headerOffset = 80; // 固定ヘッダー分のオフセット
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    
                    // CTAクリック追跡
                    trackCTAClick(this.textContent.trim(), targetId);
                }
            });
        });
    }
    
    // ==========================================
    // 固定CTAボタンの表示制御
    // ==========================================
    function initFixedCTA() {
        const fixedCTA = document.getElementById('fixed-cta');
        const heroSection = document.getElementById('hero');
        const ctaSection = document.getElementById('cta-section');
        
        if (!fixedCTA || !heroSection || !ctaSection) return;
        
        function toggleFixedCTA() {
            const heroBottom = heroSection.getBoundingClientRect().bottom;
            const ctaTop = ctaSection.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            // Hero セクションを過ぎて、CTA セクションに到達する前に表示
            if (heroBottom < 0 && ctaTop > windowHeight) {
                fixedCTA.style.display = 'flex';
                fixedCTA.style.animation = 'slideInFromRight 0.5s ease-out';
            } else {
                fixedCTA.style.display = 'none';
            }
        }
        
        window.addEventListener('scroll', throttle(toggleFixedCTA, 100));
        toggleFixedCTA(); // 初期表示チェック
    }
    
    // ==========================================
    // スクロールアニメーション
    // ==========================================
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // アニメーション対象要素
        const animateElements = document.querySelectorAll(
            '.problem-item, .feature-card, .testimonial-card, .approach-item'
        );
        
        animateElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
        
        // CSS クラス追加
        const style = document.createElement('style');
        style.textContent = `
            .animate-in {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // ==========================================
    // 緊急性演出タイマー
    // ==========================================
    function initUrgencyTimer() {
        const timerElements = document.querySelectorAll('.urgency-timer');
        if (timerElements.length === 0) return;
        
        let timeLeft = CONFIG.urgencyTimerStart * 60; // 秒に変換
        
        function updateTimer() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            timerElements.forEach(el => {
                el.textContent = display;
            });
            
            if (timeLeft > 0) {
                timeLeft--;
                setTimeout(updateTimer, 1000);
            } else {
                // タイマー終了時の処理
                timerElements.forEach(el => {
                    el.textContent = '期限切れ';
                    el.style.color = 'var(--warning-red)';
                });
            }
        }
        
        updateTimer();
    }
    
    // ==========================================
    // Exit Intent ポップアップ
    // ==========================================
    function initExitIntentPopup() {
        let hasShownPopup = false;
        let isMouseNearTop = false;
        
        function showExitPopup() {
            if (hasShownPopup) return;
            hasShownPopup = true;
            
            const popup = createExitPopup();
            document.body.appendChild(popup);
            
            // ポップアップ表示アニメーション
            setTimeout(() => {
                popup.classList.add('show');
            }, 100);
        }
        
        function createExitPopup() {
            const popup = document.createElement('div');
            popup.className = 'exit-popup';
            popup.innerHTML = `
                <div class="exit-popup-overlay">
                    <div class="exit-popup-content">
                        <button class="exit-popup-close">&times;</button>
                        <h3>ちょっと待ってください！</h3>
                        <p>このチャンスを見逃すと、<br><strong>ライバルに差をつけられてしまいます</strong></p>
                        <div class="exit-popup-offer">
                            <span class="offer-text">今なら</span>
                            <span class="offer-highlight">無料相談</span>
                            <span class="offer-text">で詳しくご説明します</span>
                        </div>
                        <a href="https://calendar.app.google/8h5EYhXbxc6bauKc6" class="cta-btn primary large" target="_blank" rel="noopener noreferrer">
                            <i class="fas fa-phone"></i>
                            無料相談はこちら
                        </a>
                    </div>
                </div>
            `;
            
            // スタイル追加
            const style = document.createElement('style');
            style.textContent = `
                .exit-popup {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.3s ease, visibility 0.3s ease;
                }
                .exit-popup.show {
                    opacity: 1;
                    visibility: visible;
                }
                .exit-popup-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .exit-popup-content {
                    background: white;
                    padding: 3rem 2rem;
                    border-radius: 15px;
                    text-align: center;
                    max-width: 500px;
                    position: relative;
                    animation: popupSlide 0.5s ease-out;
                }
                @keyframes popupSlide {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .exit-popup-close {
                    position: absolute;
                    top: 15px;
                    right: 20px;
                    background: none;
                    border: none;
                    font-size: 2rem;
                    color: var(--dark-gray);
                    cursor: pointer;
                }
                .exit-popup h3 {
                    color: var(--primary-blue);
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                }
                .exit-popup p {
                    color: var(--dark-gray);
                    margin-bottom: 1.5rem;
                    line-height: 1.6;
                }
                .exit-popup-offer {
                    background: linear-gradient(135deg, var(--accent-orange), #ff8c42);
                    color: white;
                    padding: 1rem;
                    border-radius: 10px;
                    margin-bottom: 2rem;
                }
                .offer-highlight {
                    font-size: 1.3rem;
                    font-weight: bold;
                    display: block;
                    margin: 0.5rem 0;
                }
            `;
            document.head.appendChild(style);
            
            // 閉じるボタンのイベント
            popup.querySelector('.exit-popup-close').addEventListener('click', () => {
                popup.remove();
            });
            
            // オーバーレイクリックで閉じる
            popup.querySelector('.exit-popup-overlay').addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    popup.remove();
                }
            });
            
            return popup;
        }
        
        // Exit Intent 検知
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY <= 10) {
                isMouseNearTop = true;
                setTimeout(() => {
                    if (isMouseNearTop) {
                        showExitPopup();
                    }
                }, CONFIG.exitIntentDelay);
            }
        });
        
        document.addEventListener('mouseenter', () => {
            isMouseNearTop = false;
        });
        
        // スマートフォン向け：長時間滞在後に表示
        if (window.innerWidth <= 767) {
            setTimeout(showExitPopup, CONFIG.popupDelay);
        }
    }
    
    // ==========================================
    // フォーム改善機能
    // ==========================================
    function initFormEnhancements() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // リアルタイムバリデーション
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', validateField);
                input.addEventListener('input', debounce(validateField, 500));
            });
            
            // フォーム送信時の処理
            form.addEventListener('submit', handleFormSubmit);
        });
        
        function validateField(e) {
            const field = e.target;
            const value = field.value.trim();
            
            // エラー表示をクリア
            clearFieldError(field);
            
            // バリデーション実行
            if (field.hasAttribute('required') && !value) {
                showFieldError(field, 'この項目は必須です');
                return false;
            }
            
            if (field.type === 'email' && value && !isValidEmail(value)) {
                showFieldError(field, '正しいメールアドレスを入力してください');
                return false;
            }
            
            if (field.type === 'tel' && value && !isValidPhone(value)) {
                showFieldError(field, '正しい電話番号を入力してください');
                return false;
            }
            
            // 成功スタイル
            field.style.borderColor = 'var(--accent-orange)';
            return true;
        }
        
        function handleFormSubmit(e) {
            e.preventDefault();
            
            const form = e.target;
            const formData = new FormData(form);
            
            // バリデーション
            let isValid = true;
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (!validateField({ target: input })) {
                    isValid = false;
                }
            });
            
            if (!isValid) return;
            
            // フォーム送信処理
            submitForm(form, formData);
        }
        
        async function submitForm(form, formData) {
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // ローディング状態
            submitBtn.textContent = '送信中...';
            submitBtn.disabled = true;
            
            try {
                // ここで実際のフォーム送信処理を行う
                // 今回はデモ用の処理
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // 成功処理
                showSuccessMessage(form);
                trackConversion('form_submit', Object.fromEntries(formData));
                
            } catch (error) {
                console.error('フォーム送信エラー:', error);
                showErrorMessage(form, 'エラーが発生しました。もう一度お試しください。');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    }
    
    // ==========================================
    // コンバージョン追跡
    // ==========================================
    function trackCTAClick(buttonText, targetSection) {
        console.log('CTA クリック:', {
            button: buttonText,
            target: targetSection,
            timestamp: new Date().toISOString(),
            page: window.location.href
        });
        
        // Google Analytics や他の追跡ツールへの送信
        if (typeof gtag !== 'undefined') {
            gtag('event', 'cta_click', {
                'button_text': buttonText,
                'target_section': targetSection
            });
        }
    }
    
    function trackConversion(type, data) {
        console.log('コンバージョン:', {
            type: type,
            data: data,
            timestamp: new Date().toISOString()
        });
        
        // Google Analytics コンバージョン追跡
        if (typeof gtag !== 'undefined') {
            gtag('event', 'conversion', {
                'conversion_type': type,
                'value': 1
            });
        }
    }
    
    // ==========================================
    // ユーティリティ関数
    // ==========================================
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    function isValidPhone(phone) {
        return /^[\d\-\(\)\+\s]{10,}$/.test(phone);
    }
    
    function clearFieldError(field) {
        const errorEl = field.parentNode.querySelector('.field-error');
        if (errorEl) {
            errorEl.remove();
        }
        field.style.borderColor = '';
    }
    
    function showFieldError(field, message) {
        clearFieldError(field);
        
        const errorEl = document.createElement('div');
        errorEl.className = 'field-error';
        errorEl.style.color = 'var(--warning-red)';
        errorEl.style.fontSize = '0.9rem';
        errorEl.style.marginTop = '5px';
        errorEl.textContent = message;
        
        field.parentNode.appendChild(errorEl);
        field.style.borderColor = 'var(--warning-red)';
    }
    
    function showSuccessMessage(form) {
        const successEl = document.createElement('div');
        successEl.className = 'form-success';
        successEl.innerHTML = `
            <div style="
                background: var(--accent-orange);
                color: white;
                padding: 1rem;
                border-radius: 5px;
                text-align: center;
                margin: 1rem 0;
            ">
                <i class="fas fa-check-circle"></i>
                送信が完了しました！担当者より24時間以内にご連絡いたします。
            </div>
        `;
        
        form.insertBefore(successEl, form.firstChild);
        form.style.display = 'none';
    }
    
    function showErrorMessage(form, message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'form-error';
        errorEl.innerHTML = `
            <div style="
                background: var(--warning-red);
                color: white;
                padding: 1rem;
                border-radius: 5px;
                text-align: center;
                margin: 1rem 0;
            ">
                <i class="fas fa-exclamation-triangle"></i>
                ${message}
            </div>
        `;
        
        form.insertBefore(errorEl, form.firstChild);
        setTimeout(() => errorEl.remove(), 5000);
    }
    
    // ==========================================
    // 初期化実行
    // ==========================================
    initSmoothScroll();
    initFixedCTA();
    initScrollAnimations();
    initUrgencyTimer();
    initExitIntentPopup();
    initFormEnhancements();
    
    console.log('タクシー広告LP JavaScript 初期化完了');
});