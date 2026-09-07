export default function Menu({ onClose, onSelect }) {
    return (
        <div className="aeropay-screen">
            <p className="settings-header">Menu</p>
            <div className="back-icon" onClick={onClose}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </div>

            {/* You can push the menu up or down by changing marginTop: '100px' */}
            <div style={{ marginTop: '100px', width: '100%', display: 'flex', flexDirection: 'column' }}>
                <button
                    onClick={() => onSelect("settings")}
                    /* You can change the font size by modifying fontSize: '23px' */
                    style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '23px', fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', textAlign: 'left', padding: '15px 20px', cursor: 'pointer', outline: 'none', width: '100%' }}
                >
                    Setup
                </button>

                {/* This divider now has no horizontal padding, so it stretches 100% across the screen */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', width: '100%', margin: '5px 0' }}></div>

                <button
                    onClick={() => onSelect("history")}
                    /* You can change the font size by modifying fontSize: '23px' */
                    style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '23px', fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', textAlign: 'left', padding: '15px 20px', cursor: 'pointer', outline: 'none', width: '100%' }}
                >
                    Balance & History
                </button>

                {/* This divider now has no horizontal padding, so it stretches 100% across the screen */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', width: '100%', margin: '5px 0' }}></div>

                <button
                    onClick={() => onSelect("lock_amount")}
                    /* You can change the font size by modifying fontSize: '23px' */
                    style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '23px', fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', textAlign: 'left', padding: '15px 20px', cursor: 'pointer', outline: 'none', width: '100%' }}
                >
                    Lock Amount
                </button>
            </div>
        </div>
    );
}
