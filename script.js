class Calculator {
  constructor() {
    this.display = document.getElementById('display');
    this.expression = document.getElementById('expression');
    this.currentValue = '0';
    this.previousValue = '';
    this.operation = null;
    this.shouldResetDisplay = false;
    this.history = JSON.parse(localStorage.getItem('calcHistory') || '[]');
    this.isScientific = JSON.parse(localStorage.getItem('calcScientific') || 'false');
    this.historyList = document.getElementById('historyList');
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadTheme();
    this.toggleScientific(this.isScientific);
    this.renderHistory();
    this.updateDisplay();
  }

  bindEvents() {
    document.querySelector('.btn-grid').addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      this.handleAction(btn.dataset.action);
    });

    document.querySelector('.sci-buttons')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      this.handleScientific(btn.dataset.action);
    });

    document.getElementById('modeToggle').addEventListener('click', () => {
      this.toggleScientific(!this.isScientific);
    });

    document.getElementById('themeToggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    document.getElementById('historyToggle').addEventListener('click', () => {
      document.getElementById('historyPanel').classList.toggle('open');
    });

    document.getElementById('clearHistory').addEventListener('click', () => {
      this.history = [];
      localStorage.removeItem('calcHistory');
      this.renderHistory();
    });

    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  handleAction(action) {
    switch (action) {
      case 'clear': this.clear(); break;
      case 'delete': this.delete(); break;
      case 'percent': this.percent(); break;
      case 'divide': this.setOperation('/'); break;
      case 'multiply': this.setOperation('*'); break;
      case 'subtract': this.setOperation('-'); break;
      case 'add': this.setOperation('+'); break;
      case 'calculate': this.calculate(); break;
      case 'decimal': this.inputDecimal(); break;
      default:
        if (!isNaN(action)) this.inputNumber(action);
    }
  }

  handleScientific(action) {
    const num = parseFloat(this.currentValue);
    if (isNaN(num) && action !== 'pi' && action !== 'e' && action !== 'rand' && action !== 'inv') return;

    let result;
    switch (action) {
      case 'sin':
        result = Math.sin(this.toRadians(num));
        break;
      case 'cos':
        result = Math.cos(this.toRadians(num));
        break;
      case 'tan':
        result = Math.tan(this.toRadians(num));
        break;
      case 'log':
        result = Math.log10(num);
        break;
      case 'ln':
        result = Math.log(num);
        break;
      case 'sqrt':
        result = Math.sqrt(num);
        break;
      case 'cbrt':
        result = Math.cbrt(num);
        break;
      case 'square':
        result = num * num;
        break;
      case 'cube':
        result = num * num * num;
        break;
      case 'power':
        this.previousValue = this.currentValue;
        this.operation = '^';
        this.shouldResetDisplay = true;
        this.updateDisplay();
        return;
      case 'factorial':
        result = this.factorial(num);
        break;
      case 'inv':
        if (num === 0) { this.showError('Cannot divide by zero'); return; }
        result = 1 / num;
        break;
      case 'pi':
        this.currentValue = String(Math.PI);
        this.updateDisplay();
        return;
      case 'e':
        this.currentValue = String(Math.E);
        this.updateDisplay();
        return;
      case 'abs':
        result = Math.abs(num);
        break;
      case 'mod':
        this.previousValue = this.currentValue;
        this.operation = '%';
        this.shouldResetDisplay = true;
        this.updateDisplay();
        return;
      case 'exp':
        result = Math.exp(num);
        break;
      case 'rand':
        this.currentValue = String(Math.random());
        this.updateDisplay();
        return;
      default:
        return;
    }

    if (result !== undefined) {
      if (!isFinite(result)) {
        this.showError('Infinity');
        return;
      }
      this.currentValue = this.formatNumber(result);
      this.expression.textContent = `${action}(${this.formatNumber(num)})`;
      this.shouldResetDisplay = true;
      this.updateDisplay();
    }
  }

  toRadians(deg) {
    return deg * (Math.PI / 180);
  }

  factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    if (!Number.isInteger(n)) return this.gamma(n + 1);
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }

  gamma(n) {
    // Stirling's approximation for non-integer factorial
    return Math.sqrt(2 * Math.PI * n) * Math.pow(n / Math.E, n);
  }

  inputNumber(num) {
    if (this.shouldResetDisplay) {
      this.currentValue = num;
      this.shouldResetDisplay = false;
    } else {
      if (this.currentValue === '0' && num !== '.') {
        this.currentValue = num;
      } else {
        if (this.currentValue.replace('-','').replace('.','').length >= 15) return;
        this.currentValue += num;
      }
    }
    this.updateDisplay();
  }

  inputDecimal() {
    if (this.shouldResetDisplay) {
      this.currentValue = '0.';
      this.shouldResetDisplay = false;
      this.updateDisplay();
      return;
    }
    if (!this.currentValue.includes('.')) {
      this.currentValue += '.';
    }
    this.updateDisplay();
  }

  setOperation(op) {
    if (this.operation && !this.shouldResetDisplay) {
      this.calculate(true);
    }
    this.previousValue = this.currentValue;
    this.operation = op;
    this.shouldResetDisplay = true;
    this.expression.textContent = `${this.formatNumber(this.previousValue)} ${this.getOpSymbol(op)}`;
    this.updateDisplay();
  }

  getOpSymbol(op) {
    const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^', '%': 'mod' };
    return symbols[op] || op;
  }

  calculate(chaining = false) {
    if (!this.operation) return;
    const prev = parseFloat(this.previousValue);
    const curr = parseFloat(this.currentValue);
    if (isNaN(prev) || isNaN(curr)) return;

    let result;
    const opSymbol = this.getOpSymbol(this.operation);
    switch (this.operation) {
      case '+': result = prev + curr; break;
      case '-': result = prev - curr; break;
      case '*': result = prev * curr; break;
      case '/':
        if (curr === 0) { this.showError('Cannot divide by zero'); return; }
        result = prev / curr;
        break;
      case '^': result = Math.pow(prev, curr); break;
      case '%': result = prev % curr; break;
      default: return;
    }

    if (!isFinite(result)) {
      this.showError('Infinity');
      return;
    }

    const formattedPrev = this.formatNumber(prev);
    const formattedCurr = this.formatNumber(curr);
    const formattedResult = this.formatNumber(result);

    this.expression.textContent = `${formattedPrev} ${opSymbol} ${formattedCurr} =`;
    this.currentValue = formattedResult;
    this.operation = null;
    this.shouldResetDisplay = true;

    if (!chaining) {
      this.addToHistory(`${formattedPrev} ${opSymbol} ${formattedCurr}`, formattedResult);
    }

    this.updateDisplay();
  }

  percent() {
    const num = parseFloat(this.currentValue);
    if (isNaN(num)) return;
    if (this.previousValue && this.operation) {
      const base = parseFloat(this.previousValue);
      this.currentValue = this.formatNumber(base * (num / 100));
    } else {
      this.currentValue = this.formatNumber(num / 100);
    }
    this.shouldResetDisplay = true;
    this.updateDisplay();
  }

  clear() {
    this.currentValue = '0';
    this.previousValue = '';
    this.operation = null;
    this.shouldResetDisplay = false;
    this.expression.textContent = '';
    this.updateDisplay();
  }

  delete() {
    if (this.shouldResetDisplay) return;
    this.currentValue = this.currentValue.length > 1
      ? this.currentValue.slice(0, -1)
      : '0';
    this.updateDisplay();
  }

  formatNumber(num) {
    if (typeof num === 'string') num = parseFloat(num);
    if (isNaN(num)) return 'Error';
    if (!isFinite(num)) return 'Infinity';

    if (Number.isInteger(num) && Math.abs(num) < 1e15) {
      return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }

    const str = num.toPrecision(12);
    const parsed = parseFloat(str);
    return parsed.toLocaleString('en-US', {
      maximumFractionDigits: 10,
      useGrouping: true
    });
  }

  showError(msg) {
    this.currentValue = msg;
    this.expression.textContent = '';
    this.operation = null;
    this.shouldResetDisplay = true;
    this.updateDisplay();
    setTimeout(() => {
      if (this.currentValue === msg) {
        this.currentValue = '0';
        this.updateDisplay();
      }
    }, 1500);
  }

  updateDisplay() {
    this.display.textContent = this.currentValue;
    const len = this.currentValue.replace(/[^0-9]/g, '').length;
    this.display.style.fontSize = len > 12 ? '1.4rem' : len > 9 ? '1.8rem' : '2.4rem';
  }

  toggleScientific(show) {
    this.isScientific = show;
    localStorage.setItem('calcScientific', JSON.stringify(show));
    const sciBtns = document.getElementById('sciButtons');
    if (sciBtns) sciBtns.style.display = show ? 'grid' : 'none';
    document.getElementById('modeToggle').style.opacity = show ? '1' : '0.5';
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('calcTheme', next);
  }

  loadTheme() {
    const saved = localStorage.getItem('calcTheme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }

  addToHistory(expr, result) {
    this.history.unshift({ expr, result, id: Date.now() });
    if (this.history.length > 50) this.history.pop();
    localStorage.setItem('calcHistory', JSON.stringify(this.history));
    this.renderHistory();
  }

  renderHistory() {
    this.historyList.innerHTML = '';
    if (this.history.length === 0) {
      this.historyList.innerHTML = '<div class="history-empty">No calculations yet</div>';
      return;
    }
    this.history.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <div class="hist-expr">${item.expr}</div>
        <div class="hist-result">${item.result}</div>
      `;
      div.addEventListener('click', () => {
        this.currentValue = item.result.replace(/,/g, '');
        this.operation = null;
        this.previousValue = '';
        this.shouldResetDisplay = true;
        this.expression.textContent = '';
        this.updateDisplay();
      });
      this.historyList.appendChild(div);
    });
  }

  handleKeyboard(e) {
    if (e.ctrlKey || e.metaKey) return;

    const keyMap = {
      '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
      '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
      '.': 'decimal', ',': 'decimal',
      '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide',
      'Enter': 'calculate', '=': 'calculate',
      'Backspace': 'delete', 'Delete': 'clear',
      '%': 'percent', 'Escape': 'clear',
      '^': 'power', '!': 'factorial',
    };

    const key = e.key;
    const action = keyMap[key];

    if (action) {
      e.preventDefault();

      if (!isNaN(key)) {
        this.handleAction(key);
      } else if (action === 'power' || action === 'factorial') {
        this.handleScientific(action);
      } else {
        this.handleAction(action);
      }
      return;
    }

    if (key === '(' || key === ')') return;
    if (key.length === 1 && /[a-zA-Z]/.test(key)) {
      const sciMap = { 's': 'sin', 'c': 'cos', 't': 'tan', 'l': 'log', 'n': 'ln', 'p': 'pi', 'e': 'e', 'r': 'sqrt' };
      const mapped = sciMap[key.toLowerCase()];
      if (mapped) {
        e.preventDefault();
        this.handleScientific(mapped);
      }
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new Calculator();
});
