// src/components/ScheduleDisplay.js
import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { generateSchedule } from '../utils/scheduleGenerator'; // Adjust the path as necessary

function ScheduleDisplay({
  config,
  constraints,
  scheduleError,
  scheduleTrigger,
  setScheduleTrigger,
  setScheduleError,
}) {
  const [generatedSchedule, setGeneratedSchedule] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const teamConstraintsRef = useRef([]); // Use ref to store teamConstraints
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const initiateScheduleGeneration = async () => {
      console.log('Initiating schedule generation...');
      console.log('Team Constraints:', constraints);
      setIsGenerating(true);
      setScheduleError('');
      setGeneratedSchedule(null);
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Transform constraints from week-wise to team-wise
      const transformedTeamConstraints = {}
      constraints.forEach((weekConstraints, weekIndex) => {
        console.log('Week Constraints:', weekConstraints);
        weekConstraints.unavailableTeams.forEach((teamIndex) => {
            if (!transformedTeamConstraints[teamIndex]) {
                transformedTeamConstraints[teamIndex] = [];
            }
          transformedTeamConstraints[teamIndex].push(weekIndex); // weeks are 1-based
        });
      });
      teamConstraintsRef.current = transformedTeamConstraints; // Set the transformed constraints
      console.log('Transformed Team Constraints:', teamConstraintsRef.current);

      try {
        const result = await generateSchedule(
          config.teamNames,
          transformedTeamConstraints,
          config,
          signal
        );
        console.log('Schedule Generation Result:', result);
        if (result.success) {
          console.log('Schedule generated successfully.');
          setGeneratedSchedule(result.schedule);
        } else {
          console.log('Schedule generation failed:', result.message);
          setScheduleError(result.message);
        }
      } catch (error) {
        if (error.message !== 'Schedule generation cancelled.') {
          console.log('Error during schedule generation:', error.message);
          setScheduleError(error.message);
        } else {
          console.log('Schedule generation was cancelled.');
        }
      } finally {
        setIsGenerating(false);
        setScheduleTrigger(null);
      }
    };

    if (scheduleTrigger === 'generate') {
      initiateScheduleGeneration();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleTrigger]);

  // Function to export data to CSV
  const exportToCSV = () => {
    let csvContent = '';

    // 1. Export Team Constraints
    csvContent += 'Team Name,Unavailable Weeks\n';
    config.teamNames.forEach((team, index) => {
      const unavailableWeeks = teamConstraintsRef.current[index].join(', ');
      csvContent += `${team}, ${unavailableWeeks}\n`;
    });

    csvContent += '\n'; // Add a blank line between sections

    // 2. Export Schedule
    if (generatedSchedule.length > 0) {
      // Determine the maximum number of games in any week for header
      const maxGames = Math.max(
        ...generatedSchedule.map((weekGames) => weekGames.length),
        0
      );
      let header = 'Week';
      for (let i = 1; i <= maxGames; i++) {
        header += `, Game${i}`;
      }
      csvContent += `${header}\n`;

      // Add each week's schedule
      generatedSchedule.forEach((weekGames, weekIndex) => {
        let row = `Week ${weekIndex + 1}`;
        weekGames.forEach((game) => {
          row += `, ${game[0]} vs ${game[1]}`;
        });
        // If fewer games than maxGames, add empty fields
        for (let i = weekGames.length; i < maxGames; i++) {
          row += ',';
        }
        csvContent += `${row}\n`;
      });
    } else {
      csvContent += 'No schedule available to export.\n';
    }

    console.log('CSV Content:', csvContent);

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'schedule_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to cancel schedule generation
  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  if (isGenerating) {
    return (
      <div style={{ marginTop: '30px' }}>
        <h2>Generating Schedule...</h2>
        <div className="spinner" style={{ margin: '20px 0' }}>
          {/* Simple CSS Spinner */}
          <div
            style={{
              border: '8px solid #f3f3f3',
              borderTop: '8px solid #3498db',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              animation: 'spin 2s linear infinite',
              margin: 'auto',
            }}
          ></div>
        </div>
        <button
          onClick={cancelGeneration}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#e74c3c',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Cancel Generation
        </button>
      </div>
    );
  }

  if (generatedSchedule) {
    return (
      <div style={{ marginTop: '30px' }}>
        <h2>Generated Schedule</h2>
        <table
          border="1"
          cellPadding="10"
          cellSpacing="0"
          style={{ borderCollapse: 'collapse', width: '100%' }}
        >
          <thead>
            <tr>
              <th>Week</th>
              <th>Matchups</th>
            </tr>
          </thead>
          <tbody>
            {generatedSchedule.map((weekGames, index) => (
              <tr key={index}>
                <td style={{ textAlign: 'center' }}>Week {index + 1}</td>
                <td>
                  {weekGames.length > 0 ? (
                    <ul>
                      {weekGames.map((game, idx) => (
                        <li key={idx}>
                          {game[0]} vs {game[1]}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <em>No games this week.</em>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Export to CSV Button */}
        <button
          onClick={exportToCSV}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#2ecc71',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Export to CSV
        </button>
      </div>
    );
  }

  return null;
}

ScheduleDisplay.propTypes = {
  config: PropTypes.shape({
    numTeams: PropTypes.number.isRequired,
    minWeeks: PropTypes.number.isRequired,
    teamNames: PropTypes.arrayOf(PropTypes.string).isRequired,
    gamesPerTeam: PropTypes.number.isRequired,
    gamesPerWeek: PropTypes.number.isRequired,
  }).isRequired,
  constraints: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.number).isRequired
  ).isRequired, // Changed to array of arrays of numbers
  scheduleError: PropTypes.string.isRequired,
  scheduleTrigger: PropTypes.string,
  setScheduleTrigger: PropTypes.func.isRequired,
  setScheduleError: PropTypes.func.isRequired,
};

export default ScheduleDisplay;