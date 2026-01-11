const CONFIG = {
    telegramBot: 'Polyleech_bot'
};

let connectedWallet = null;
let walletProvider = null;
let isVerified = false;

const modal = document.getElementById('wallet-modal');
const stepConnect = document.getElementById('step-connect');
const stepSign = document.getElementById('step-sign');
const stepSuccess = document.getElementById('step-success');
const stepError = document.getElementById('step-error');

function openModal() {
    modal.classList.add('active');
    showStep('connect');
}

function closeModal() {
    modal.classList.remove('active');
}

function showStep(step) {
    stepConnect.classList.add('hidden');
    stepSign.classList.add('hidden');
    stepSuccess.classList.add('hidden');
    stepError.classList.add('hidden');
    
    if (step === 'connect') stepConnect.classList.remove('hidden');
    if (step === 'sign') stepSign.classList.remove('hidden');
    if (step === 'success') stepSuccess.classList.remove('hidden');
    if (step === 'error') stepError.classList.remove('hidden');
}

function showError(msg) {
    document.getElementById('error-message').textContent = msg;
    showStep('error');
}

async function connectPhantom() {
    try {
        const provider = window.phantom?.solana;
        if (!provider?.isPhantom) {
            window.open('https://phantom.app/', '_blank');
            showError('Please install Phantom wallet and refresh the page.');
            return;
        }
        const response = await provider.connect();
        connectedWallet = response.publicKey.toString();
        walletProvider = provider;
        document.getElementById('connected-wallet').textContent = connectedWallet;
        showStep('sign');
    } catch (err) {
        showError('Connection rejected. Please try again.');
    }
}

async function connectSolflare() {
    try {
        const provider = window.solflare;
        if (!provider?.isSolflare) {
            window.open('https://solflare.com/', '_blank');
            showError('Please install Solflare wallet and refresh the page.');
            return;
        }
        await provider.connect();
        connectedWallet = provider.publicKey.toString();
        walletProvider = provider;
        document.getElementById('connected-wallet').textContent = connectedWallet;
        showStep('sign');
    } catch (err) {
        showError('Failed to connect. Please try again.');
    }
}

async function signVerificationMessage() {
    if (!connectedWallet || !walletProvider) {
        showError('Wallet not connected. Please try again.');
        return;
    }
    
    try {
        const message = 'PolyLeech Wallet Verification: ' + connectedWallet;
        const encodedMessage = new TextEncoder().encode(message);
        
        await walletProvider.signMessage(encodedMessage, 'utf8');
        
        isVerified = true;
        
        var shortWallet = connectedWallet.slice(0, 4) + '...' + connectedWallet.slice(-4);
        document.getElementById('verified-wallet').textContent = shortWallet;
        document.getElementById('leech-balance').textContent = '0 $LEECH';
        document.getElementById('user-tier').textContent = '👀 Freebie';
        
        showStep('success');
    } catch (err) {
        showError('Signature rejected. Please try again.');
    }
}

function openTelegramBot() {
    if (!isVerified || !connectedWallet) {
        alert('Please verify your wallet first!');
        return;
    }
    var url = 'https://t.me/' + CONFIG.telegramBot + '?start=' + connectedWallet;
    window.location.href = url;
}

document.addEventListener('DOMContentLoaded', function() {
    var navBtn = document.getElementById('nav-connect-btn');
    var heroBtn = document.getElementById('hero-connect-btn');
    var ctaBtn = document.getElementById('cta-connect-btn');
    
    if (navBtn) navBtn.addEventListener('click', openModal);
    if (heroBtn) heroBtn.addEventListener('click', openModal);
    if (ctaBtn) ctaBtn.addEventListener('click', openModal);
    
    var closeBtn = document.getElementById('modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    var backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeModal);
    
    var phantomBtn = document.getElementById('connect-phantom-btn');
    if (phantomBtn) phantomBtn.addEventListener('click', connectPhantom);
    
    var solflareBtn = document.getElementById('connect-solflare-btn');
    if (solflareBtn) solflareBtn.addEventListener('click', connectSolflare);
    
    var signBtn = document.getElementById('sign-message-btn');
    if (signBtn) signBtn.addEventListener('click', signVerificationMessage);
    
    var retryBtn = document.getElementById('retry-btn');
    if (retryBtn) retryBtn.addEventListener('click', function() { showStep('connect'); });
    
    var openBotBtn = document.getElementById('open-bot-btn');
    if (openBotBtn) {
        openBotBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openTelegramBot();
        });
    }
    
    var buyBtn = document.getElementById('buy-leech-btn');
    if (buyBtn) {
        buyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.open('https://raydium.io/swap/', '_blank');
        });
    }
    
    var copyBtns = document.querySelectorAll('.btn-copy-trader');
    copyBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            window.open('https://t.me/' + CONFIG.telegramBot, '_blank');
        });
    });
    
    var heroCopyBtn = document.querySelector('.hero-card .btn-copy');
    if (heroCopyBtn) {
        heroCopyBtn.addEventListener('click', function() {
            window.open('https://t.me/' + CONFIG.telegramBot, '_blank');
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
});
