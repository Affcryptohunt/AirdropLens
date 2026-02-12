import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const GasTracker = () => {
  const [gas, setGas] = useState(null);

  useEffect(() => {
    const getGas = async () => {
      try {
        const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
        const feeData = await provider.getFeeData();
        const gwei = ethers.formatUnits(feeData.gasPrice, "gwei");
        setGas(Math.round(parseFloat(gwei)));
      } catch (e) {
        console.error(e);
      }
    };
    getGas();
    const interval = setInterval(getGas, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
      <div className={`w-2 h-2 rounded-full animate-pulse ${gas < 30 ? 'bg-green-400' : 'bg-orange-400'}`}></div>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
        {gas ? `${gas} GWEI` : "..."}
      </span>
    </div>
  );
};

export default GasTracker;