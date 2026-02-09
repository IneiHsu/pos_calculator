import React, { useState, useEffect } from 'react';
import { Delete, RotateCcw, FileText, Download, X, DollarSign, Save } from 'lucide-react';

export default function App() {
  // --- 核心状态管理 ---
  const [cartItems, setCartItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({ value: '0', count: 1, isPreset: false });
  const [stage, setStage] = useState('input_value');

  const [displayValue, setDisplayValue] = useState('0');
  const [expression, setExpression] = useState(''); 
  
  // --- POS 流程状态 ---
  const [mode, setMode] = useState('calculating'); 
  const [finalTotal, setFinalTotal] = useState(null);
  const [receivedAmount, setReceivedAmount] = useState(null);
  
  // --- 历史记录 ---
  const [historyLog, setHistoryLog] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [counts, setCounts] = useState({ 100: 0, 200: 0, 300: 0, 400: 0, 500: 0 });

  // 颜色配置
  const colorMap = {
    100: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    200: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    300: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    400: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    500: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  };

  const formatNumber = (num) => parseFloat(parseFloat(num).toPrecision(12)).toString();

  // --- 核心逻辑 ---

  // 1. 输入数字
  const inputDigit = (digit) => {
    if (mode === 'change') {
      fullReset();
      updateCurrentItemValue(String(digit));
      return;
    }

    if (stage === 'input_value') {
      let newVal;
      // 处理 00 的逻辑：如果当前是0，输入00还是0；如果有数字，追加00
      if (digit === '00') {
        newVal = currentItem.value === '0' ? '0' : currentItem.value + '00';
      } else {
        newVal = currentItem.value === '0' ? String(digit) : currentItem.value + digit;
      }
      updateCurrentItemValue(newVal);
    } else {
      // 数量输入阶段
      const isJustSwitched = String(currentItem.value) === displayValue;
      let newDisplay;
      if (digit === '00') {
        newDisplay = (displayValue === '0' || isJustSwitched) ? '0' : displayValue + '00';
      } else {
        newDisplay = (displayValue === '0' || isJustSwitched) ? String(digit) : displayValue + digit;
      }
      
      setDisplayValue(newDisplay);
      setCurrentItem(prev => ({ ...prev, count: parseInt(newDisplay) || 0 }));
    }
  };

  const updateCurrentItemValue = (valStr) => {
    setCurrentItem(prev => ({ ...prev, value: valStr, isPreset: false })); 
    setDisplayValue(valStr);
  };

  // 2. 输入定额
  const inputPreset = (value) => {
    if (navigator.vibrate) navigator.vibrate(50);
    
    if (mode === 'change') fullReset();

    if (stage === 'input_quantity') {
      commitCurrentItem();
    } else if (currentItem.value !== '0' && !currentItem.isPreset) {
      commitCurrentItem();
    } else if (currentItem.isPreset) {
       commitCurrentItem();
    }

    setCurrentItem({ value: String(value), count: 1, isPreset: true });
    setDisplayValue(String(value));
    setStage('input_value');
  };

  // 3. 操作符
  const performOperation = (op) => {
    if (mode !== 'calculating') return;

    if (op === '×') {
      setStage('input_quantity');
    } else if (op === '+') {
      commitCurrentItem();
      setDisplayValue('0');
    } else if (op === '-') {
       commitCurrentItem(); 
       setDisplayValue('0');
    }
  };

  // 4. 确认当前项
  const commitCurrentItem = () => {
    const val = parseFloat(currentItem.value);
    const count = currentItem.count;
    
    if (val === 0) return;

    const newItem = { ...currentItem, value: val }; 
    const newCart = [...cartItems, newItem];
    setCartItems(newCart);

    const itemStr = newItem.isPreset ? 
       (count > 1 ? `${val}×${count}` : `${val}`) : 
       (count > 1 ? `${val}×${count}` : `${val}`);
    
    setExpression(prev => prev ? `${prev} + ${itemStr}` : itemStr);

    setCurrentItem({ value: '0', count: 1, isPreset: false });
    setStage('input_value');
  };

  // 5. 结算 (等号)
  const handleEqual = () => {
    let finalCart = [...cartItems];
    if (parseFloat(currentItem.value) !== 0) {
      finalCart.push({ ...currentItem, value: parseFloat(currentItem.value) });
    }

    if (finalCart.length === 0) return;

    const total = finalCart.reduce((acc, item) => acc + (item.value * item.count), 0);

    setCartItems([]); 
    setCurrentItem({ value: String(total), count: 1, isPreset: false });
    setStage('input_value');
    
    setDisplayValue(String(formatNumber(total)));
    
    const fullExp = finalCart.map(item => item.count > 1 ? `${item.value}×${item.count}` : item.value).join(' + ');
    setExpression(`${fullExp} =`);
    
    // 更新统计
    updateCountsFromCart(finalCart);
  };

  // 改进：使用函数式更新，确保累加而不是覆盖
  const updateCountsFromCart = (cart) => {
    setCounts(prevCounts => {
      const newCounts = { ...prevCounts };
      cart.forEach(item => {
        if (newCounts[item.value] !== undefined) {
          newCounts[item.value] += item.count;
        }
      });
      return newCounts;
    });
  };

  // 6. x1.1 (彻底修复：先记录数量，再计算金额)
  const multiplyBy1Point1 = () => {
    // 步骤1：检查是否有待结算的商品，先将它们的数量记录下来
    let finalCart = [...cartItems];
    if (parseFloat(currentItem.value) !== 0) {
      finalCart.push({ ...currentItem, value: parseFloat(currentItem.value) });
    }

    let baseTotal = 0;

    if (finalCart.length > 0) {
      // 记录这些商品的数量
      updateCountsFromCart(finalCart);
      
      // 计算基础总价
      baseTotal = finalCart.reduce((acc, item) => acc + (item.value * item.count), 0);
      
      // 更新表达式显示
      const fullExp = finalCart.map(item => item.count > 1 ? `${item.value}×${item.count}` : item.value).join(' + ');
      setExpression(`(${fullExp}) × 1.1`);
      
      // 清空购物车，因为我们即将把它们合并为一个总金额
      setCartItems([]);
    } else {
      // 如果购物车为空（比如刚按了等于号），直接基于屏幕数字计算
      baseTotal = parseFloat(displayValue);
      setExpression(prev => prev ? `(${prev}) × 1.1` : `× 1.1`);
    }

    if (baseTotal === 0) return;

    // 步骤2：执行乘法
    const newVal = baseTotal * 1.1;
    setDisplayValue(String(formatNumber(newVal)));
    
    // 步骤3：将结果设置为新的当前值（不再是预设颜色，避免重复计数）
    setCurrentItem({ value: String(newVal), count: 1, isPreset: false });
  };

  // 7. 支付
  const handlePayment = () => {
    let total = parseFloat(displayValue);
    
    // 同样：如果有未提交的商品，先提交并记录数量
    const hasRawItems = cartItems.length > 0 || currentItem.isPreset;

    if (hasRawItems) {
       let finalCart = [...cartItems];
       if (parseFloat(currentItem.value) !== 0) {
          finalCart.push({ ...currentItem, value: parseFloat(currentItem.value) });
       }
       // 记录数量
       updateCountsFromCart(finalCart);
       // 计算总价
       total = finalCart.reduce((acc, item) => acc + (item.value * item.count), 0);
    } 

    if (total === 0) return;

    setFinalTotal(total);
    setMode('paying');
    
    setDisplayValue('0');
    setCurrentItem({ value: '0', count: 1, isPreset: false });
    
    setExpression(`应收: ${formatNumber(total)} | 请输入实收...`);
  };

  const confirmPayment = () => {
    const received = parseFloat(displayValue);
    setReceivedAmount(received);
    const change = received - finalTotal;
    setDisplayValue(String(formatNumber(change)));
    setMode('change');
    setExpression(`总计: ${formatNumber(finalTotal)} | 实收: ${received}`);
  };

  const handleRecord = () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const newRecord = {
      id: Date.now(),
      time: timeStr,
      counts: { ...counts },
      total: finalTotal,
      received: receivedAmount
    };

    setHistoryLog([newRecord, ...historyLog]);
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    fullReset();
  };

  const fullReset = () => {
    setCartItems([]);
    setCurrentItem({ value: '0', count: 1, isPreset: false });
    setStage('input_value');
    setDisplayValue('0');
    setExpression('');
    setMode('calculating');
    setFinalTotal(null);
    setReceivedAmount(null);
    setCounts({ 100: 0, 200: 0, 300: 0, 400: 0, 500: 0 });
  };
  
  const deleteLast = () => {
    if (mode === 'change') return;
    if (displayValue.length > 1) {
      const newVal = displayValue.slice(0, -1);
      setDisplayValue(newVal);
      if (stage === 'input_value') setCurrentItem(prev => ({...prev, value: newVal}));
      else setCurrentItem(prev => ({...prev, count: parseInt(newVal) || 0}));
    } else {
      setDisplayValue('0');
      if (stage === 'input_value') setCurrentItem(prev => ({...prev, value: '0'}));
      else setCurrentItem(prev => ({...prev, count: 0}));
    }
  };

  const downloadCSV = () => {
    const header = "time,red_num,orange_num,green_num,blue_num,purple_num,total,received\n";
    const rows = historyLog.map(item => {
      return `${item.time},${item.counts[100]},${item.counts[200]},${item.counts[300]},${item.counts[400]},${item.counts[500]},${item.total},${item.received}`;
    }).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURI(header + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `sales_record_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const Button = ({ label, onClick, className = "", colorClass = "bg-gray-100 text-gray-800 active:bg-gray-200" }) => (
    <button
      onClick={onClick}
      className={`
        h-14 sm:h-16 rounded-xl sm:rounded-2xl text-lg sm:text-xl font-semibold shadow-sm transition-all transform active:scale-95 flex items-center justify-center select-none relative
        ${colorClass} ${className}
      `}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans touch-manipulation">
      <div className="w-full max-w-md bg-white h-screen sm:h-auto sm:min-h-[800px] sm:rounded-3xl sm:shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* 顶部状态栏 */}
        <div className="bg-gray-900 text-gray-300 px-4 py-2 flex justify-between items-center text-xs sm:text-sm">
          <button onClick={() => setShowHistoryModal(true)} className="flex items-center gap-1 hover:text-white transition-colors">
            <FileText size={16} /> 查看记录 ({historyLog.length})
          </button>
          <div className="flex gap-2">
            {/* 预览逻辑：显示已提交 counts + 当前正在输入的 item */}
            {(() => {
              const previewCounts = { ...counts };
              cartItems.forEach(item => { if(previewCounts[item.value] !== undefined) previewCounts[item.value] += item.count; });
              if(currentItem.isPreset && previewCounts[currentItem.value] !== undefined) previewCounts[currentItem.value] += currentItem.count;
              
              return Object.entries(previewCounts).map(([val, count]) => count > 0 && (
                <span key={val} className={`px-1.5 py-0.5 rounded text-[10px] ${colorMap[val].bg} ${colorMap[val].text}`}>
                  {val}: {count}
                </span>
              ));
            })()}
          </div>
        </div>

        {/* 屏幕 */}
        <div className="bg-gray-900 text-white p-6 pt-2 flex flex-col justify-end h-40 relative">
          <div className="text-gray-400 text-right text-sm min-h-[1.5rem] mb-1 break-words leading-tight">
            {expression}
            {currentItem.value !== '0' && stage === 'input_value' && cartItems.length > 0 && ` + ${currentItem.value}`}
            {stage === 'input_quantity' && ` × ${currentItem.count}`}
          </div>
          <div className="flex justify-between items-end">
            <div className="text-xs text-indigo-400 font-bold mb-2">
               {mode === 'paying' ? '实收金额' : mode === 'change' ? '找零' : '当前输入'}
            </div>
            <div className="text-right text-5xl font-light tracking-wide break-all">
              {displayValue}
            </div>
          </div>
        </div>

        {/* 键盘 */}
        <div className="flex-1 p-3 grid grid-cols-4 gap-2 sm:gap-3 bg-gray-50 pb-8 sm:pb-4">
          {[100, 200, 300, 400].map(val => (
            <Button key={val} label={val} onClick={() => inputPreset(val)} colorClass={`${colorMap[val].bg} ${colorMap[val].text} active:bg-gray-50 border ${colorMap[val].border}`} />
          ))}
          <Button label="500" onClick={() => inputPreset(500)} colorClass={`${colorMap[500].bg} ${colorMap[500].text} active:bg-gray-50 border ${colorMap[500].border}`} />
          
          <Button label="x1.1" onClick={multiplyBy1Point1} colorClass="bg-teal-600 text-white active:bg-teal-700" />
          <Button label={<RotateCcw size={20}/>} onClick={fullReset} colorClass="bg-gray-200 text-red-600 active:bg-gray-300" />
          <Button label={<Delete size={20}/>} onClick={deleteLast} colorClass="bg-gray-200 text-gray-700 active:bg-gray-300" />

          <Button label="7" onClick={() => inputDigit(7)} colorClass="bg-white text-gray-900 shadow-sm border border-gray-100" />
          <Button label="8" onClick={() => inputDigit(8)} colorClass="bg-white text-gray-900 shadow-sm border border-gray-100" />
          <Button label="9" onClick={() => inputDigit(9)} colorClass="bg-white text-gray-900 shadow-sm border border-gray-100" />
          <Button label="实收" onClick={handlePayment} colorClass="bg-emerald-600 text-white font-bold text-lg active:bg-emerald-700 shadow-sm" />

          <Button label="4" onClick={() => inputDigit(4)} colorClass="bg-white text-gray-900 shadow-sm border border-gray-100" />
          <Button label="5" onClick={() => inputDigit(5)} colorClass="bg-white text-gray-900 shadow-sm border border-gray-100" />
          <Button label="6" onClick={() => inputDigit(6)} colorClass="bg-white text-gray-900 shadow-sm border border-gray-100" />
          <Button label="×" onClick={() => performOperation('×')} colorClass="bg-indigo-50 text-indigo-600 font-bold text-xl" />

          <Button label="1" onClick={() => inputDigit(1)} colorClass="bg-white text-gray-900 shadow-sm border border-gray-100" />
          <Button label="2" onClick={() => inputDigit(2)} colorClass="bg-white text-gray-900 shadow-sm border border-gray-100" />
          <Button label="3" onClick={() => inputDigit(3)} colorClass="bg-white text-gray-900 shadow-sm border border-gray-100" />
          <Button label="+" onClick={() => performOperation('+')} colorClass="bg-indigo-50 text-indigo-600 font-bold text-xl" />

          <Button label="0" onClick={() => inputDigit(0)} colorClass="bg-white text-gray-900 shadow-sm border border-gray-100" />
          {/* 00 按钮直接传递字符串 '00' */}
          <Button label="00" onClick={() => inputDigit('00')} colorClass="bg-white text-gray-900 shadow-sm border border-gray-100 font-bold" />
          
          {mode === 'change' ? (
             <Button label={<div className="flex items-center gap-1"><Save size={18}/> 记录</div>} onClick={handleRecord} colorClass="bg-gray-800 text-white text-lg active:bg-black shadow-lg" />
          ) : mode === 'paying' ? (
             <Button label="=" onClick={confirmPayment} colorClass="bg-blue-600 text-white text-2xl active:bg-blue-700 shadow-lg" />
          ) : (
             <Button label="=" onClick={handleEqual} colorClass="bg-blue-600 text-white text-2xl active:bg-blue-700 shadow-lg" />
          )}

          <Button label="+" onClick={() => performOperation('+')} colorClass="bg-indigo-50 text-indigo-600 font-bold text-xl" />
        </div>

        {/* 历史记录模态框 (保持不变) */}
        {showHistoryModal && (
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex justify-end">
            <div className="w-4/5 sm:w-2/3 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h2 className="font-bold text-lg text-gray-800">交易记录</h2>
                <button onClick={() => setShowHistoryModal(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {historyLog.length === 0 ? <div className="text-center text-gray-400 mt-10">暂无记录</div> : historyLog.map((log) => (
                  <div key={log.id} className="bg-white border rounded-xl p-3 shadow-sm text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-gray-700">{log.time}</span>
                      <span className="font-mono font-bold text-indigo-600">¥{formatNumber(log.total)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {Object.entries(log.counts).map(([k, v]) => v > 0 && (
                        <span key={k} className={`text-[10px] px-1.5 rounded ${colorMap[k].bg} ${colorMap[k].text}`}>{k}×{v}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t bg-gray-50">
                <button onClick={downloadCSV} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 active:bg-indigo-700">
                  <Download size={20} /> 下载 CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}