/**
 * AIRDROPLENS - FULL PRODUCTION SOURCE
 * ------------------------------------
 * @version 1.1.0
 * @status Hardened
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, ListChecks, Activity, Loader2, 
  FileSpreadsheet, Flame, Twitter, ExternalLink, AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';

// --- WEB3 ENGINE IMPORTS ---
import '@rainbow-me/rainbowkit/styles.css';
import { 
  getDefaultConfig, 
  RainbowKitProvider, 
  darkTheme, 
  ConnectButton 
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, useAccount } from 'wagmi';
import { mainnet, base, optimism, arbitrum } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { http } from 'viem';

// --- UTILITIES (CRITICAL: Ensure these exist in your /utils folder) ---
import { 
  checkBaseBridgeUsage, 
  checkAerodromeUser, 
  checkUniswapUser, 
  checkMainnetUniswap, 
  checkENSUser, 
  calculateSybilRisk 
} from './utils/eligibility';

// --- CONFIGURATION ---
// We use the VITE_ prefix so the browser can see it
const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_KEY || "nsCngDhoNy8FfxPUKK7SJ";

const config = getDefaultConfig({
  appName: 'AirdropLens',
  projectId: '93f30999059f3c1564c70037a1f81648', 
  chains: [mainnet, base, optimism, arbitrum],
  transports: {
    [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    [base.id]: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    [optimism.id]: http(`https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    [arbitrum.id]: http(`https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
  },
  ssr: false, 
});

const queryClient = new QueryClient();

// --- 1. ROOT PROVIDER WRAPPER ---
export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()} modalSize="compact">
          <AirdropLensLogic />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// --- 2. CORE APPLICATION LOGIC ---
function AirdropLensLogic() {
  const { address, isConnected } = useAccount();

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState('scanner');
  const [subTab, setSubTab] = useState('checker'); // 'checker' vs 'analyzer'
  const [scanMode, setScanMode] = useState('single');
  const [isScanning, setIsScanning] = useState(false);
  
  // Data State
  const [gasPrices, setGasPrices] = useState({ eth: '..', base: '..' });
  const [vaultResults, setVaultResults] = useState([]);
  const [onChainResults, setOnChainResults] = useState([]);
  const [walletStats, setWalletStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDonateModal, setShowDonateModal] = useState(false);

  // --- INFRASTRUCTURE: REAL-TIME GAS TRACKER (ETH + BASE) ---
  useEffect(() => {
    const fetchGas = async () => {
      try {
        // Create dedicated providers for real-time fee data
        const ethProvider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`);
        const baseProvider = new ethers.JsonRpcProvider(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`);

        const [ethFee, baseFee] = await Promise.all([
          ethProvider.getFeeData(),
          baseProvider.getFeeData()
        ]);
        
        // Convert to Gwei and update state
        const ethGwei = ethers.formatUnits(ethFee.gasPrice || 0, "gwei");
        const baseGwei = ethers.formatUnits(baseFee.gasPrice || 0, "gwei");

        setGasPrices({ 
          eth: Math.round(parseFloat(ethGwei)).toString(), 
          base: parseFloat(baseGwei).toFixed(2) 
        }); 
      } catch (err) {
        console.error("Gas fetch failed:", err);
      }
    };

    fetchGas(); 
    const interval = setInterval(fetchGas, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, []);

  // --- LOGIC: MASTER SCANNER ---
  const handleScan = async () => {
    let targetAddress = scanMode === 'single' 
      ? document.getElementById('walletInput')?.value?.trim() 
      : document.getElementById('bulkInput')?.value?.split('\n')[0]?.trim();

    if (!targetAddress && isConnected && address) targetAddress = address;

    if (!targetAddress || !ethers.isAddress(targetAddress)) {
      setErrorMsg("Please enter a valid EVM address (0x...)");
      return;
    }

    setErrorMsg("");
    setIsScanning(true);
    setVaultResults([]); 
    setOnChainResults([]);

    try {
      // Parallel checks: Database + On-Chain Protocols
      const [vaultRes, ethRes, bridgeUsed, aerodromeUsed, uniBase, uniMain, ensUsed] = await Promise.all([
        fetch(`/api/airdrops?address=${targetAddress.toLowerCase()}`),
        fetch(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([
            { jsonrpc: "2.0", id: 1, method: "eth_getTransactionCount", params: [targetAddress, "latest"] },
            { jsonrpc: "2.0", id: 2, method: "eth_getBalance", params: [targetAddress, "latest"] }
          ])
        }),
        checkBaseBridgeUsage(targetAddress, ALCHEMY_KEY),
        checkAerodromeUser(targetAddress, ALCHEMY_KEY),
        checkUniswapUser(targetAddress, ALCHEMY_KEY),
        checkMainnetUniswap(targetAddress, ALCHEMY_KEY),
        checkENSUser(targetAddress, ALCHEMY_KEY)
      ]);

      // 1. Process Database Vault (Real Payouts)
      const vaultData = await vaultRes.json();
      if (vaultData.success) {
        setVaultResults(vaultData.data);
      }

      // 2. Process On-Chain Stats
      const ethData = await ethRes.json();
      const txCount = parseInt(ethData[0]?.result || "0x0", 16);
      const balanceEth = ethers.formatEther(ethData[1]?.result || "0x0");
      const riskProfile = calculateSybilRisk(txCount, balanceEth);

      // 3. Build Analysis Report
      const analysisReport = [
        { 
          id: 'ens', 
          name: 'ENS Domain', 
          status: ensUsed ? 'Owned' : 'None', 
          desc: ensUsed ? 'Active .eth identity found.' : 'No ENS registration detected.' 
        },
        { 
          id: 'dex', 
          name: 'DEX Activity', 
          status: uniMain || uniBase ? 'Trader' : 'None', 
          desc: `Active on ${uniMain ? 'Mainnet' : ''} ${uniBase ? 'and Base' : ''}.` 
        },
        { 
          id: 'base-bridge', 
          name: 'Base L2 Bridge', 
          status: bridgeUsed ? 'Bridged' : 'Ghost', 
          desc: bridgeUsed ? 'Official bridge transaction verified.' : 'No L1-L2 bridge history.' 
        },
        { 
          id: 'aerodrome', 
          name: 'Aerodrome Finance', 
          status: aerodromeUsed ? 'Liquidity Provider' : 'Inactive', 
          desc: aerodromeUsed ? 'Interacted with Base native DEX.' : 'No Aerodrome history found.' 
        }
      ];

      setOnChainResults(analysisReport);
      setWalletStats({ 
        address: targetAddress, 
        totalTxs: txCount, 
        risk: riskProfile.label 
      });

    } catch (err) {
      console.error(err);
      setErrorMsg("Scan failed. RPC limit reached or Network error.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      
      {/* NAVBAR */}
      <nav className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('scanner')}>
            <ShieldCheck className="text-emerald-500" size={26} />
            <span className="text-xl font-black uppercase italic tracking-tighter">Airdrop<span className="text-emerald-500">Lens</span></span>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time Gas Widget */}
            <div className="hidden md:flex items-center gap-4 bg-zinc-900 border border-white/10 px-4 py-2 rounded-lg">
               <div className="flex flex-col items-center leading-none">
                 <span className="text-[9px] font-black text-zinc-500 uppercase">ETH</span>
                 <span className={`text-xs font-bold font-mono ${parseInt(gasPrices.eth) < 30 ? 'text-emerald-500' : 'text-orange-500'}`}>
                   {gasPrices.eth}
                 </span>
               </div>
               <div className="w-px h-6 bg-white/10"></div>
               <div className="flex flex-col items-center leading-none">
                 <span className="text-[9px] font-black text-zinc-500 uppercase">BASE</span>
                 <span className="text-xs font-bold font-mono text-blue-500">
                   {gasPrices.base}
                 </span>
               </div>
            </div>
            
            <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        
        {/* TAB SWITCHER */}
        <div className="flex gap-6 mb-8 border-b border-white/5 pb-4">
          <button 
            onClick={() => setActiveTab('scanner')} 
            className={`text-sm font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'scanner' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-500 hover:text-white'}`}
          >
            Eligibility Scanner
          </button>
          <button 
            onClick={() => setActiveTab('feed')} 
            className={`text-sm font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'feed' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-500 hover:text-white'}`}
          >
            Live Airdrops
          </button>
        </div>

        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: SCANNER INPUT */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[32px] backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black uppercase italic text-white">Wallet Audit</h2>
                  <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
                    <button onClick={() => setScanMode('single')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${scanMode === 'single' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Single</button>
                    <button onClick={() => setScanMode('bulk')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${scanMode === 'bulk' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Bulk</button>
                  </div>
                </div>

                <div className="space-y-4">
                  <input 
                    id="walletInput" 
                    type="text" 
                    defaultValue={isConnected && address ? address : ''}
                    placeholder="PASTE EVM ADDRESS (0x...)" 
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-5 px-6 text-base font-mono text-white focus:border-emerald-500/50 outline-none transition-all" 
                  />
                  
                  {/* SEARCH TYPE TOGGLE */}
                  <div className="flex gap-2 p-1 bg-black/40 border border-white/5 rounded-xl w-fit">
                    <button 
                      onClick={() => setSubTab('checker')} 
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${subTab === 'checker' ? 'bg-emerald-500 text-black' : 'text-zinc-500'}`}
                    >
                      Airdrop Checker
                    </button>
                    <button 
                      onClick={() => setSubTab('analyzer')} 
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${subTab === 'analyzer' ? 'bg-blue-500 text-white' : 'text-zinc-500'}`}
                    >
                      Wallet Analyzer
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 text-red-400 text-[10px] font-black uppercase">
                      <AlertTriangle size={14} /> {errorMsg}
                    </div>
                  )}

                  <button 
                    onClick={handleScan} 
                    disabled={isScanning} 
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isScanning ? <Loader2 className="animate-spin" size={18} /> : 'Check Eligibility'}
                  </button>
                </div>
              </div>

              {/* SCAN RESULTS AREA */}
              <div className="space-y-4">
                {subTab === 'checker' ? (
                  // AIRDROP VAULT VIEW
                  vaultResults.length > 0 ? (
                    vaultResults.map((drop, i) => (
                      <div key={i} className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex justify-between items-center animate-in slide-in-from-bottom-2">
                        <div>
                          <p className="text-[10px] font-black text-emerald-500 uppercase">Project Verified</p>
                          <h3 className="text-xl font-black uppercase italic text-white">{drop.project_slug}</h3>
                          <p className="text-sm font-mono text-emerald-400">{drop.token_amount} TOKENS</p>
                        </div>
                        <button className="bg-emerald-500 text-black px-6 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-white transition-all">
                          Claim Portal
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center border border-dashed border-white/5 rounded-3xl">
                      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-tighter">No verified claims found in the vault for this address</p>
                    </div>
                  )
                ) : (
                  // WALLET ANALYZER VIEW
                  onChainResults.length > 0 ? (
                    onChainResults.map((res, i) => (
                      <div key={i} className="bg-zinc-900 border border-white/5 p-6 rounded-2xl flex justify-between items-center animate-in slide-in-from-bottom-2">
                        <div>
                          <h3 className="text-sm font-black text-zinc-400 uppercase">{res.name}</h3>
                          <p className="text-xs text-white font-mono mt-1">{res.desc}</p>
                        </div>
                        <span className="text-[9px] font-black uppercase px-3 py-1 bg-white/5 border border-white/5 rounded-full text-zinc-400">
                          {res.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center border border-dashed border-white/5 rounded-3xl">
                      <p className="text-zinc-600 text-[10px] font-black uppercase">Run audit to analyze on-chain activity</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: DONATE & INFO */}
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-white/5 p-8 rounded-[32px] text-center">
                <h3 className="text-xs font-black uppercase text-zinc-500 mb-4">Support Development</h3>
                <p className="text-2xl font-black text-white italic mb-6">Keep AirdropLens<br/>Free & Open Source</p>
                <button 
                  onClick={() => setShowDonateModal(true)} 
                  className="w-full bg-white/5 border border-white/10 hover:bg-white hover:text-black text-white py-4 rounded-xl font-black uppercase text-[10px] transition-all"
                >
                  Donate ETH
                </button>
              </div>

              <div className="bg-orange-500/5 border border-orange-500/10 p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={16} className="text-orange-500" />
                  <h4 className="text-xs font-black uppercase text-orange-500">Security Audit</h4>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed uppercase font-bold">
                  Read-only access. We never request private keys or transaction signatures.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FEED TAB */}
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
             {[{ name: 'Monad', type: 'Layer 1' }, { name: 'Berachain', type: 'Layer 1' }, { name: 'Scroll', type: 'ZK-Rollup' }].map((drop, i) => (
               <div key={i} className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl group hover:border-emerald-500/30 transition-all">
                 <h3 className="text-2xl font-black uppercase italic group-hover:text-emerald-500 transition-colors">{drop.name}</h3>
                 <p className="text-[10px] font-black text-zinc-500 uppercase mt-1">{drop.type}</p>
                 <button className="mt-8 w-full py-4 bg-black border border-white/5 rounded-xl text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">
                   Official Portal
                 </button>
               </div>
             ))}
          </div>
        )}
      </main>

      {/* DONATE MODAL */}
      <AnimatePresence>
        {showDonateModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          >
            <div className="bg-zinc-900 border border-white/10 p-10 rounded-[40px] w-full max-w-md text-center">
              <h3 className="text-2xl font-black uppercase italic mb-2">Support AirdropLens</h3>
              <p className="text-xs text-zinc-500 mb-8 uppercase font-bold">Funds cover real-time RPC costs</p>
              <div className="bg-black border border-white/5 p-5 rounded-2xl mb-8 font-mono text-xs text-emerald-500 break-all select-all">
                0x11C656d0eC7579234d3C6E0306e6d3296E8A5BBa
              </div>
              <button 
                onClick={() => setShowDonateModal(false)} 
                className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] hover:bg-emerald-500 hover:text-white transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}