// Main App Component
function App() {
    const [count, setCount] = React.useState(0);
    const [inputValue, setInputValue] = React.useState('');

    const handleIncrement = () => {
        setCount(count + 1);
    };

    const handleDecrement = () => {
        setCount(count - 1);
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>Welcome to Lisoscope</h1>
                <p>A React App built with CDN</p>
            </header>
            
            <main className="app-main">
                <section className="counter-section">
                    <h2>Counter Example</h2>
                    <div className="counter">
                        <button onClick={handleDecrement}>-</button>
                        <span className="count">{count}</span>
                        <button onClick={handleIncrement}>+</button>
                    </div>
                </section>

                <section className="input-section">
                    <h2>Input Example</h2>
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder="Type something..."
                        className="text-input"
                    />
                    <p>You typed: <strong>{inputValue}</strong></p>
                </section>

                <section className="features">
                    <h2>Features</h2>
                    <ul>
                        <li>✅ React 18 with Hooks</li>
                        <li>✅ State Management</li>
                        <li>✅ Event Handling</li>
                        <li>✅ Responsive Design</li>
                        <li>✅ No build tools required</li>
                    </ul>
                </section>
            </main>
        </div>
    );
}

console.log("Hello World");

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
