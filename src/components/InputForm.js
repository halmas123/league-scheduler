import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function InputForm({ setConfig }) {
  const [numTeams, setNumTeams] = useState(10);
  const [gamesPerTeam, setGamesPerTeam] = useState(8);
  const [gamesPerWeek, setGamesPerWeek] = useState(4);
  const [teamNames, setTeamNames] = useState(
    Array(10).fill('').map((_, i) => `Team ${i + 1}`)
  );
  const [totalWeeks, setTotalWeeks] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    // Calculate total weeks based on current values
    if (gamesPerWeek > 0) {
      const calculatedWeeks = Math.ceil(
        (numTeams * gamesPerTeam) / (2 * gamesPerWeek)
      );
      setTotalWeeks(calculatedWeeks);
    }

    // Validate games per week based on number of teams
    const maxGamesPerWeek = Math.floor(numTeams / 2);
    if (gamesPerWeek > maxGamesPerWeek) {
      setError(
        `Games per week can't be greater than ${maxGamesPerWeek} for ${numTeams} teams.`
      );
    } else {
      setError('');
    }
  }, [numTeams, gamesPerTeam, gamesPerWeek]);

  useEffect(() => {
    // Adjust the team names array based on the number of teams
    setTeamNames((prevTeamNames) => {
      const updatedNames = [...prevTeamNames];

      // When the number of teams increases
      if (numTeams > updatedNames.length) {
        for (let i = updatedNames.length; i < numTeams; i++) {
          updatedNames.push(`Team ${i + 1}`);
        }
      }

      // When the number of teams decreases
      if (numTeams < updatedNames.length) {
        updatedNames.length = numTeams;
      }

      return updatedNames;
    });
  }, [numTeams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation
    if (
      numTeams < 2 ||
      gamesPerTeam < 1 ||
      gamesPerWeek < 1 ||
      teamNames.some((name) => name.trim() === '')
    ) {
      alert('Please enter valid team names and configurations.');
      return;
    }

    setConfig({
      numTeams,
      minWeeks: totalWeeks,
      teamNames,
      gamesPerTeam,
      gamesPerWeek,
    });
  };

  const handleTeamNameChange = (index, value) => {
    const updatedNames = [...teamNames];
    updatedNames[index] = value;
    setTeamNames(updatedNames);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Number of Teams:</label>
        <input
          type="number"
          value={numTeams}
          onChange={(e) => setNumTeams(parseInt(e.target.value))}
          min="2"
          required
        />
      </div>
      <div>
        <label>Games Per Team:</label>
        <input
          type="number"
          value={gamesPerTeam}
          onChange={(e) => setGamesPerTeam(parseInt(e.target.value))}
          min="1"
          max={numTeams - 1} // Prevent user from entering an invalid value
          required
        />
      </div>
      <div>
        <label>Games Per Week:</label>
        <input
          type="number"
          value={gamesPerWeek}
          onChange={(e) => setGamesPerWeek(parseInt(e.target.value))}
          min="1"
          max={Math.floor(numTeams / 2)} // Prevent user from entering an invalid value
          required
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
      <div>
        <label>Total Weeks: </label>
        <span>{totalWeeks}</span>
        <label> | Total Byes: </label>
        <span>{totalWeeks-gamesPerTeam}</span>
      </div>
      <div>
        <label>Team Names:</label>
        {Array.from({ length: numTeams }, (_, i) => (
          <div key={i}>
            <input
              type="text"
              value={teamNames[i]}
              onChange={(e) => handleTeamNameChange(i, e.target.value)}
              placeholder={`Team ${i + 1} Name`}
              required
            />
          </div>
        ))}
      </div>
      <button type="submit" disabled={!!error}>Set Configuration</button>
    </form>
  );
}

InputForm.propTypes = {
  setConfig: PropTypes.func.isRequired,
};

export default InputForm;