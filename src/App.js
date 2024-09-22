// src/App.js
import React, { useState, useEffect } from 'react';
import InputForm from './components/InputForm';
import ScheduleGrid from './components/ScheduleGrid';
import ScheduleDisplay from './components/ScheduleDisplay';

function App() {
  const [config, setConfig] = useState(null);
  const [availability, setAvailability] = useState({});
  const [error, setError] = useState('');
  const [scheduleTrigger, setScheduleTrigger] = useState(null); // Trigger state for schedule generation
  const [scheduleError, setScheduleError] = useState(''); // Error state for scheduling
  const [constraints, setConstraints] = useState([]); // State for constraints

  // Log constraints whenever they change
  useEffect(() => {
    console.log('App.js - Current Constraints:', constraints);
  }, [constraints]);

  const generateSchedule = () => {
    // Trigger ScheduleDisplay to generate the schedule
    setScheduleTrigger('generate');
    console.log('App.js - Generate Schedule triggered.');
  };

  return (
    <div className="App" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>League Scheduler</h1>
      {!config ? (
        <InputForm setConfig={setConfig} />
      ) : (
        <>
          <ScheduleGrid
            config={config}
            availability={availability}
            setAvailability={setAvailability}
            setError={setError}
            setConstraints={setConstraints} // Pass setConstraints to ScheduleGrid
          />
          {error && <p style={{ color: 'red' }}>{error}</p>}

          {/* Button to generate schedule */}
          <button
            onClick={generateSchedule}
            disabled={error || config.minWeeks === 0}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: error || config.minWeeks === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Generate Schedule
          </button>

          {/* Display schedule-related errors */}
          {scheduleError && <p style={{ color: 'red' }}>{scheduleError}</p>}

          {/* Render ScheduleDisplay and pass necessary props */}
          <ScheduleDisplay
            config={config}
            constraints={constraints} // Pass constraints to ScheduleDisplay
            scheduleError={scheduleError} // Pass scheduleError
            scheduleTrigger={scheduleTrigger} // Pass scheduleTrigger prop
            setScheduleTrigger={setScheduleTrigger} // Pass setScheduleTrigger
            setScheduleError={setScheduleError} // Pass setScheduleError
          />
        </>
      )}
    </div>
  );
}

export default App;