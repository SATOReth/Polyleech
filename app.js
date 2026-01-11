// ===================================
// PolyLeech - Wallet Verification
// ===================================

// Configuration
const CONFIG = {
    telegramBot: 'Polyleech_bot',
    leechTokenMint: 'So11111111111111111111111111111111111111112',
    tiers: [
        { name: 'Freebie', emoji: '👀', minBalance: 0 },
        { name: 'Leech', emoji: '🧛', minBalance: 100000 },
        { name: 'Vampire', emoji: '🦇', minBalance: 500000 },
        { name: 'Dracula', emoji: '🏰', minBalance: 2000000 },
        { name: 'Nosferatu', emoji: '👑', minBalance: 10000000 },
    ]
};

// State
let connectedWallet = null;
let walletProvider = null;
let verificationData = null;

// DOM Elements
const modal = document.getElementById('wallet-modal');
const modalClose = document.getElementById('modal-close');
const stepConnect = document.getElementById('step-connect');
const stepSign = document.getElementById('step-sign');
const stepSuccess = document.getElementById('step-success');
const stepError = document.getElementById('step-error');

// Connect buttons
const connectButtons = [
    document.getElementById('nav-connect-btn'),
    document.getElementById('hero-connect-btn'),
    document.getElementById('cta-connect-btn')
];

// ===================================
// Modal Functions
// ===================================

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
    
    switch(step) {
        case 'connect':
            stepConnect.classList.remove('hidden');
            break;
        case 'sign':
            stepSign.classList.remove('hidden');
            break;
        case 'success':
            stepSuccess.classList.remove('hidden');
            break;
        case 'error':
            stepError.classList.remove('hidden');
            break;
    }
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    showStep('error');
}

// ===================================
// Wallet Connection
// ===================================

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
        
    } catch (error) {
        console.error('Phantom connection error:', error);
        if (error.code === 4001) {
            showError('Connection rejected. Please try again.');
        } else {
            showError('Failed to connect. Please try again.');
        }
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
        
    } catch (error) {
        console.error('Solflare connection error:', error);
        showError('Failed to connect. Please try again.');
    }
}

// ===================================
// Message Signing & Verification
// ===================================

async function signVerificationMessage() {
    if (!connectedWallet || !walletProvider) {
        showError('Wallet not connected. Please try again.');
        return;
    }
    
    try {
        const timestamp = Date.now();
        const message = `PolyLeech Verification\nWallet: ${connectedWallet}\nTimestamp: ${timestamp}`;
        
        const encodedMessage = new TextEncoder().encode(message);
        
        let signature;
        
        if (walletProvider.signMessage) {
            const signedMessage = await walletProvider.signMessage(encodedMessage, 'utf8');
            signature = signedMessage.signature || signedMessage;
        } else {
            throw new Error('Wallet does not support message signing');
        }
        
        const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
        
        const verificationToken = btoa(JSON.stringify({
            wallet: connectedWallet,
            timestamp: timestamp,
            signature: signatureBase64
        }));
        
        verificationData = {
            wallet: connectedWallet,
            token: verificationToken
        };
        
        const balance = await getLeechBalance(connectedWallet);
        const tier = getTierByBalance(balance);
        
        document.getElementById('verified-wallet').textContent = shortenAddress(connectedWallet);
        document.getElementById('leech-balance').textContent = formatNumber(balance) + ' $LEECH';
        document.getElementById('user-tier').textContent = tier.emoji + ' ' + tier.name;
        
        // Create Telegram deep link
        const telegramLink = 'https://t.me/' + CONFIG.telegramBot + '?start=verify_' + verificationToken;
        
        // Set the href on the button
        const openBotBtn = document.getElementById('open-bot-btn');
        if (openBotBtn) {
            openBotBtn.setAttribute('href', telegramLink);
            openBotBtn.setAttribute('target', '_blank');
        }
        
        showStep('success');
        
    } catch (error) {
        console.error('Signing error:', error);
        if (error.code === 4001) {
            showError('Signature rejected. Please try again.');
        } else {
            showError('Failed to sign message. Please try again.');
        }
    }
}

// ===================================
// Token Balance
// ===================================

async function getLeechBalance(walletAddress) {
    // Mock balance for demo - in production this would call Solana RPC
    return 0;
}

function getTierByBalance(balance) {
    for (let i = CONFIG.tiers.length - 1; i >= 0; i--) {
        if (balance >= CONFIG.tiers[i].minBalance) {
            return CONFIG.tiers[i];
        }
    }
    return CONFIG.tiers[0];
}

// ===================================
// Utility Functions
// ===================================

function shortenAddress(address) {
    if (!address) return '';
    return address.slice(0, 4) + '...' + address.slice(-4);
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

// ===================================
// Copy Trader Buttons
// ===================================

function handleCopyTrader(walletAddress) {
    if (!verificationData) {
        alert('Please connect and verify your wallet first!');
        openModal();
        return;
    }
    
    const link = 'https://t.me/' + CONFIG.telegramBot + '?start=copy_' + walletAddress;
    window.open(link, '_blank');
}

// ===================================
// Event Listeners
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    // Connect buttons
    connectButtons.forEach(function(btn) {
        if (btn) {
            btn.addEventListener('click', openModal);
        }
    });
    
    // Modal close
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    var backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeModal);
    }
    
    // Wallet connection buttons
    var phantomBtn = document.getElementById('connect-phantom-btn');
    if (phantomBtn) {
        phantomBtn.addEventListener('click', connectPhantom);
    }
    
    var solflareBtn = document.getElementById('connect-solflare-btn');
    if (solflareBtn) {
        solflareBtn.addEventListener('click', connectSolflare);
    }
    
    // Sign message button
    var signBtn = document.getElementById('sign-message-btn');
    if (signBtn) {
        signBtn.addEventListener('click', signVerificationMessage);
    }
    
    // Retry button
    var retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', function() {
            showStep('connect');
        });
    }
    
    // Copy trader buttons
    var copyButtons = document.querySelectorAll('.btn-copy-trader');
    copyButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var wallet = btn.getAttribute('data-wallet');
            handleCopyTrader(wallet);
        });
    });
    
    // Hero card copy button
    var heroCopyBtn = document.querySelector('.hero-card .btn-copy');
    if (heroCopyBtn) {
        heroCopyBtn.addEventListener('click', function() {
            handleCopyTrader('0x8dxd7f3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e');
        });
    }
    
    // Buy LEECH button
    var buyBtn = document.getElementById('buy-leech-btn');
    if (buyBtn) {
        buyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.open('https://raydium.io/swap/', '_blank');
        });
    }
    
    // ESC key closes modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
    
    // Smooth scroll for anchor links
    var anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            var targetId = this.getAttribute('href');
            var target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        var navbar = document.querySelector('.navbar');
        var currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.8)';
        }
    });
});

// Check for existing wallet connection on load
window.addEventListener('load', function() {
    var provider = window.phantom?.solana;
    if (provider?.isConnected && provider?.publicKey) {
        connectedWallet = provider.publicKey.toString();
        walletProvider = provider;
        
        connectButtons.forEach(function(btn) {
            if (btn && connectedWallet) {
                btn.innerHTML = '<span>🟢 ' + shortenAddress(connectedWallet) + '</span>';
            }
        });
    }
});
