import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Utility function for evaluating expressions with error handling
function evaluateExpression(expr) {
  try {
    // Basic: +, -, *, /, ^ (exponent)
    // Advanced: sqrt(number)
    // Secure eval by controlling allowed operations

    // Replace "√" or "sqrt" with Math.sqrt
    let processed = expr
      .replace(/√/g, 'Math.sqrt')
      .replace(/(\d+(\.\d+)?)\^(\d+(\.\d+)?)/g, 'Math.pow($1,$3)')
      .replace(/([0-9.]+)(?=\()/g, '$1*') // handle 2(sqrt(9))
      .replace(/([)])([0-9.]+)/g, '$1*$2');

    // Only allow digits, operators, parentheses, dot, Math.
    if (!/^[\-()\d+*/.^\sMathsqrtpow]+$/.test(processed)) {
      return { result: 'Err', error: true };
    }

    // safely evaluate using Function
    // eslint-disable-next-line no-new-func
    const fn = new Function('return ' + processed);
    let value = fn();
    if (typeof value === 'number' && isFinite(value)) {
      return { result: value, error: false };
    }
    return { result: 'Err', error: true };
  } catch {
    return { result: 'Err', error: true };
  }
}

// Button layout: rows of arrays with {label, value, type}
const BUTTONS = [
  [
    { label: 'AC', value: 'AC', type: 'func' },
    { label: 'C', value: 'C', type: 'func' },
    { label: '^', value: '^', type: 'op' },
    { label: '÷', value: '/', type: 'op' }
  ],
  [
    { label: '7', value: '7', type: 'num' },
    { label: '8', value: '8', type: 'num' },
    { label: '9', value: '9', type: 'num' },
    { label: '×', value: '*', type: 'op' }
  ],
  [
    { label: '4', value: '4', type: 'num' },
    { label: '5', value: '5', type: 'num' },
    { label: '6', value: '6', type: 'num' },
    { label: '−', value: '-', type: 'op' }
  ],
  [
    { label: '1', value: '1', type: 'num' },
    { label: '2', value: '2', type: 'num' },
    { label: '3', value: '3', type: 'num' },
    { label: '+', value: '+', type: 'op' }
  ],
  [
    { label: '0', value: '0', type: 'num', wide: true },
    { label: '.', value: '.', type: 'num' },
    { label: '√', value: '√(', type: 'op' },
    { label: '=', value: '=', type: 'equals' }
  ]
];

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light'); // for demo, since original has theme toggle
  const [expression, setExpression] = useState('');
  const [displayValue, setDisplayValue] = useState('0');
  const [history, setHistory] = useState([]);
  const [lastPressed, setLastPressed] = useState(null);
  const displayRef = useRef(null);

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle button presses
  // PUBLIC_INTERFACE
  const handleButtonClick = (button) => {
    setLastPressed(button.value);

    // Clear all
    if (button.value === 'AC') {
      setExpression('');
      setDisplayValue('0');
      return;
    }

    // Clear last character
    if (button.value === 'C') {
      if (expression.length > 0) {
        setExpression(expression.slice(0, -1));
        let exprShort = expression.slice(0, -1);
        setDisplayValue(exprShort || '0');
      }
      return;
    }

    // Enter/evaluate
    if (button.value === '=') {
      if (!expression.trim()) return;
      const { result, error } = evaluateExpression(expression.replace(/÷/g, '/').replace(/×/g, '*').replace(/−/g, '-'));
      setDisplayValue(result.toString());
      setHistory([{exp: expression, res: result.toString()}, ...history].slice(0, 10));
      setExpression('');
      return;
    }

    // For sqrt: auto append '(' if needed
    if (button.value === '√(') {
      setExpression(expression + '√(');
      setDisplayValue(expression + '√(');
      return;
    }

    // Prevent invalid consecutive operators
    const ops = ['+', '-', '*', '/', '^'];
    if (ops.includes(button.value)) {
      if (expression === '' && button.value !== '-') return;
      if (ops.includes(expression.slice(-1))) {
        setExpression(expression.slice(0,-1) + button.value);
        setDisplayValue(expression.slice(0,-1) + button.value);
        return;
      }
    }

    // Default: append
    setExpression(expression + button.value);
    setDisplayValue(expression + button.value);
  };

  // Keyboard support
  useEffect(() => {
    // PUBLIC_INTERFACE
    function handleKeyDown(e) {
      let map = {
        'Enter': '=',
        '=': '=',
        '+': '+',
        '-': '-',
        '*': '*',
        '/': '/',
        '^': '^',
        '.': '.',
        '(': '(',
        ')': ')',
        'Backspace': 'C',
        'Delete': 'AC',
      };
      if (/\d/.test(e.key)) handleButtonClick({value: e.key});
      else if (map[e.key]) handleButtonClick({value: map[e.key]});
      else if (e.key === 'r' && e.ctrlKey) handleButtonClick({value: 'AC'});
      else if (e.key === 's' && e.ctrlKey) handleButtonClick({value: '√('});
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line
  }, [expression, history]); // Add refs if needed for more precision

  // Scroll history to top on new entry
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollTop = 0;
    }
  }, [history]);

  // Styling: accent vars
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', '#FF4136');
    document.documentElement.style.setProperty('--primary', '#0074D9');
    document.documentElement.style.setProperty('--secondary', '#7FDBFF');
  }, []);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // UI
  return (
    <div className="App calculator-app-bg">
      {/* Theme toggle for demonstration */}
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        style={{zIndex:1}}
      >
        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>
      <main className="calc-center-wrapper">
        <section className="calc-panel">
          <div className="calc-display" data-testid="display">
            {displayValue}
          </div>
          <div className="calc-buttons" role="group">
            {BUTTONS.map((row, i) =>
              <div className="calc-btn-row" key={i}>
                {row.map(btn => (
                  <button
                    key={btn.label}
                    className={`calc-btn calc-btn-${btn.type} ${btn.wide ? 'calc-btn-wide' : ''}`}
                    style={
                      btn.type === 'func'
                        ? {background: 'var(--secondary)', color: 'var(--text-primary)'}
                        : btn.type === 'op'
                          ? {background: 'var(--accent)', color: '#fff'}
                          : btn.type === 'equals'
                            ? {background: 'var(--primary)', color: '#fff', fontWeight: 700}
                            : {}
                    }
                    onClick={() => handleButtonClick(btn)}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
        <section className="calc-history-panel" aria-label="Calculation History">
          <div className="history-label">History</div>
          <div className="history-scroll" ref={displayRef}>
            {history.length === 0 && <div className="history-empty">No history yet.</div>}
            {history.map((h, idx) => (
              <div className="history-item" key={idx}>
                <div className="history-exp">{h.exp}</div>
                <div className="history-res">{h.res}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
