// ===================================
// PolyLeech - Wallet Verification
// ===================================

// Configuration
const CONFIG = {
    telegramBot: 'PolyLeech_Bot',
    leechTokenMint: 'So11111111111111111111111111111111111111112', // Replace with real token mint
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
    // Hide all steps
    stepConnect.classList.add('hidden');
    stepSign.classList.add('hidden');
    stepSuccess.classList.add('hidden');
    stepError.classList.add('hidden');
    
    // Show requested step
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
        // Check if Phantom is installed
        const provider = window.phantom?.solana;
        
        if (!provider?.isPhantom) {
            // Phantom not installed, open install page
            window.open('https://phantom.app/', '_blank');
            showError('Please install Phantom wallet and refresh the page.');
            return;
        }
        
        // Connect
        const response = await provider.connect();
        connectedWallet = response.publicKey.toString();
        walletProvider = provider;
        
        // Update UI and proceed to sign step
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
        // Check if Solflare is installed
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
        // Create verification message with timestamp
        const timestamp = Date.now();
        const message = `PolyLeech Verification\nWallet: ${connectedWallet}\nTimestamp: ${timestamp}`;
        
        // Encode message
        const encodedMessage = new TextEncoder().encode(message);
        
        // Request signature
        let signature;
        
        if (walletProvider.signMessage) {
            // Phantom / Solflare
            const signedMessage = await walletProvider.signMessage(encodedMessage, 'utf8');
            signature = signedMessage.signature || signedMessage;
        } else {
            throw new Error('Wallet does not support message signing');
        }
        
        // Convert signature to base64
        const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
        
        // Create verification token (wallet:timestamp:signature)
        const verificationToken = btoa(JSON.stringify({
            wallet: connectedWallet,
            timestamp: timestamp,
            signature: signatureBase64
        }));
        
        // Store verification data
        verificationData = {
            wallet: connectedWallet,
            token: verificationToken
        };
        
        // Get token balance and tier (mock for now, would be API call)
        const balance = await getLeechBalance(connectedWallet);
        const tier = getTierByBalance(balance);
        
        // Update success UI
        document.getElementById('verified-wallet').textContent = shortenAddress(connectedWallet);
        document.getElementById('leech-balance').textContent = formatNumber(balance) + ' $LEECH';
        document.getElementById('user-tier').textContent = tier.emoji + ' ' + tier.name;
        
        // Create Telegram deep link with verification token
        const telegramLink = `https://t.me/${CONFIG.telegramBot}?start=verify_${verificationToken}`;
        document.getElementById('open-bot-btn').href = telegramLink;
        
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
// Token Balance (Mock - would be RPC call)
// ===================================

async function getLeechBalance(walletAddress) {
    // In production, this would call Solana RPC to get token balance
    // For now, return a mock balance for demo purposes
    
    // Uncomment this for real implementation:
    /*
    try {
        const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTokenAccountsByOwner',
                params: [
                    walletAddress,
                    { mint: CONFIG.leechTokenMint },
                    { encoding: 'jsonParsed' }
                ]
            })
        });
        const data = await response.json();
        // Parse balance from response
        return balance;
    } catch (error) {
        console.error('Error fetching balance:', error);
        return 0;
    }
    */
    
    // Mock balance for demo
    return 0;
}

function getTierByBalance(balance) {
    // Find highest tier user qualifies for
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
    // If not connected, prompt to connect first
    if (!verificationData) {
        alert('Please connect and verify your wallet first!');
        openModal();
        return;
    }
    
    // Open bot with copy command
    const link = `https://t.me/${CONFIG.telegramBot}?start=copy_${walletAddress}`;
    window.open(link, '_blank');
}

// ===================================
// Event Listeners
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Connect buttons
    connectButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', openModal);
        }
    });
    
    // Modal close
    modalClose?.addEventListener('click', closeModal);
    document.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);
    
    // Wallet connection buttons
    document.getElementById('connect-phantom-btn')?.addEventListener('click', connectPhantom);
    document.getElementById('connect-solflare-btn')?.addEventListener('click', connectSolflare);
    
    // Sign message button
    document.getElementById('sign-message-btn')?.addEventListener('click', signVerificationMessage);
    
    // Retry button
    document.getElementById('retry-btn')?.addEventListener('click', () => showStep('connect'));
    
    // Copy trader buttons
    document.querySelectorAll('.btn-copy-trader').forEach(btn => {
        btn.addEventListener('click', () => {
            const wallet = btn.dataset.wallet;
            handleCopyTrader(wallet);
        });
    });
    
    // Hero card copy button
    document.querySelector('.hero-card .btn-copy')?.addEventListener('click', () => {
        handleCopyTrader('0x8dxd7f3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e');
    });
    
    // Buy LEECH button
    document.getElementById('buy-leech-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('https://raydium.io/swap/', '_blank');
    });
    
    // ESC key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Navbar scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.8)';
        }
        
        lastScroll = currentScroll;
    });
});

// ===================================
// Check for existing wallet connection
// ===================================

window.addEventListener('load', async () => {
    // Check if Phantom is already connected
    const provider = window.phantom?.solana;
    if (provider?.isConnected) {
        connectedWallet = provider.publicKey?.toString();
        walletProvider = provider;
        
        // Update connect buttons to show connected state
        connectButtons.forEach(btn => {
            if (btn && connectedWallet) {
                btn.innerHTML = `<span>🟢 ${shortenAddress(connectedWallet)}</span>`;
            }
        });
    }
});
