// src/components/ScheduleGrid.js
import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

function ScheduleGrid({ config, availability, setAvailability, setError, setConstraints }) {
  const { numTeams, minWeeks, teamNames, gamesPerTeam, gamesPerWeek } = config;

  // Initialize availability state when config changes
  useEffect(() => {
    const initialAvailability = {};
    teamNames.forEach((team) => {
      initialAvailability[team] = new Array(minWeeks).fill(false);
    });
    setAvailability(initialAvailability);
    setError(''); // Reset errors on new config
    setConstraints([]); // Reset constraints when config changes
  }, [config, setAvailability, teamNames, minWeeks, setError, setConstraints]);

  // Calculate total games needed
  const totalGamesNeeded = useMemo(() => (numTeams * gamesPerTeam) / 2, [numTeams, gamesPerTeam]);

  // Calculate possible games per week based on current availability
  const possibleGamesPerWeek = useMemo(() => {
    if (
      !availability ||
      Object.keys(availability).length === 0 ||
      teamNames.some((team) => !availability[team] || availability[team].length !== minWeeks)
    ) {
      // Availability not initialized yet
      return new Array(minWeeks).fill(0);
    }

    const games = [];
    for (let week = 0; week < minWeeks; week++) {
      const unavailableTeams = teamNames.filter((team) => availability[team][week]);
      const availableTeams = numTeams - unavailableTeams.length;
      const maxGamesThisWeek = Math.min(gamesPerWeek, Math.floor(availableTeams / 2));
      games.push(maxGamesThisWeek);
    }
    return games;
  }, [availability, minWeeks, teamNames, numTeams, gamesPerWeek]);

  // Total possible games across all weeks
  const totalPossibleGames = useMemo(() => {
    return possibleGamesPerWeek.reduce((acc, curr) => acc + curr, 0);
  }, [possibleGamesPerWeek]);

  // Compile constraints as an array of weeks with unavailable teams
  useEffect(() => {
    if (
      availability &&
      Object.keys(availability).length === numTeams &&
      teamNames.every((team) => availability[team] && availability[team].length === minWeeks)
    ) {
      const compiledConstraints = [];
      for (let week = 0; week < minWeeks; week++) {
        const unavailableTeams = teamNames.filter((team) => availability[team][week]);
        compiledConstraints.push({
          week: week + 1,
          unavailableTeams,
        });
      }
      setConstraints(compiledConstraints);
    }
  }, [availability, teamNames, minWeeks, numTeams, setConstraints]);

  // Handle checkbox changes with constraints
  const handleCheckboxChange = (team, week) => {
    const newAvailability = { ...availability };
    const currentStatus = newAvailability[team][week];
    newAvailability[team][week] = !currentStatus;

    // Temporarily set the new availability to calculate possible games
    const tempAvailability = { ...newAvailability };

    // Recalculate possible games per week with the temporary availability
    const tempPossibleGamesPerWeek = possibleGamesPerWeek.map((games, w) => {
      const unavailableTeams = teamNames.filter((t) => tempAvailability[t][w]);
      const availableTeams = numTeams - unavailableTeams.length;
      return Math.min(gamesPerWeek, Math.floor(availableTeams / 2));
    });

    const tempTotalPossibleGames = tempPossibleGamesPerWeek.reduce((acc, curr) => acc + curr, 0);

    // Check if the new total possible games is sufficient
    if (tempTotalPossibleGames < totalGamesNeeded) {
      setError(
        `Cannot mark ${team} as unavailable for Week ${week + 1}. Doing so would reduce the total possible games below the required ${totalGamesNeeded}.`
      );
      console.log(`Error: Marking ${team} unavailable for Week ${week + 1} violates total games needed.`);
      return; // Do not update the availability
    }

    // Calculate the number of unavailable weeks for the team
    const unavailableWeeks = newAvailability[team].filter((unavailable) => unavailable).length;
    const maxUnavailable = minWeeks - gamesPerTeam;

    // Check if the number of unavailable weeks exceeds the maximum allowed
    if (unavailableWeeks > maxUnavailable) {
      setError(
        `Error: ${team} cannot have more than ${maxUnavailable} unavailable weeks.`
      );
      console.log(`Error: ${team} exceeds max unavailable weeks (${maxUnavailable}).`);
      return; // Do not update the availability
    } else {
      setError('');
    }

    // If all checks pass, update the availability
    setAvailability(newAvailability);
  };

  // Render the scheduling grid
  const renderGrid = () => {
    return (
      <table border="1" cellPadding="5" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Team</th>
            {Array.from({ length: minWeeks }, (_, i) => (
              <th key={i}>Week {i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teamNames.map((team, rowIndex) => {
            const unavailableWeeks = availability[team].filter((unavailable) => unavailable).length;
            const maxUnavailable = minWeeks - gamesPerTeam;

            return (
              <tr key={rowIndex}>
                <td>{team}</td>
                {Array.from({ length: minWeeks }, (_, weekIndex) => {
                  const isChecked = availability[team][weekIndex] || false;

                  // Calculate potential unavailable weeks after this change
                  const wouldBeUnavailable = isChecked
                    ? unavailableWeeks - 1
                    : unavailableWeeks + 1;

                  // Check individual team constraint
                  const exceedsTeamLimit = wouldBeUnavailable > maxUnavailable;

                  // Simulate availability after change
                  const tempUnavailableTeams = teamNames.filter((t) => availability[t][weekIndex]);
                  const tempAvailableTeams = numTeams - tempUnavailableTeams.length - (isChecked ? 0 : 1);
                  const tempPossibleGamesThisWeek = Math.min(gamesPerWeek, Math.floor(tempAvailableTeams / 2));

                  // Calculate new total possible games if this checkbox is toggled
                  const newPossibleGamesPerWeek = possibleGamesPerWeek.slice();
                  newPossibleGamesPerWeek[weekIndex] = tempPossibleGamesThisWeek;
                  const newTotalPossibleGames = newPossibleGamesPerWeek.reduce((acc, curr) => acc + curr, 0);

                  const disableCheckbox =
                    (!isChecked && exceedsTeamLimit) ||
                    (!isChecked && newTotalPossibleGames < totalGamesNeeded);

                  return (
                    <td key={weekIndex} style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={disableCheckbox}
                        onChange={() => handleCheckboxChange(team, weekIndex)}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {/* Bottom Row for Possible Games */}
          <tr>
            <td><strong>Possible Games</strong></td>
            {possibleGamesPerWeek.map((games, index) => (
              <td key={index} style={{ textAlign: 'center', backgroundColor: '#f0f0f0' }}>
                {games}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    );
  };

  // Guard: Ensure availability is initialized
  const isAvailabilityInitialized =
    availability &&
    Object.keys(availability).length === numTeams &&
    teamNames.every((team) => availability[team] && availability[team].length === minWeeks);

  return (
    <div>
      <h2>Select Unavailable Weeks for Each Team</h2>
      {isAvailabilityInitialized ? (
        <>
          {renderGrid()}
          <div style={{ marginTop: '10px' }}>
            <strong>Total Games Needed:</strong> {totalGamesNeeded}<br />
            <strong>Total Possible Games:</strong> {totalPossibleGames}
          </div>
          {totalPossibleGames < totalGamesNeeded && (
            <p style={{ color: 'red' }}>
              Warning: The total possible games ({totalPossibleGames}) are less than the total games needed ({totalGamesNeeded}). Please adjust your selections.
            </p>
          )}
        </>
      ) : (
        <p>Initializing availability...</p>
      )}
    </div>
  );
}

ScheduleGrid.propTypes = {
  config: PropTypes.shape({
    numTeams: PropTypes.number.isRequired,
    minWeeks: PropTypes.number.isRequired,
    teamNames: PropTypes.arrayOf(PropTypes.string).isRequired,
    gamesPerTeam: PropTypes.number.isRequired,
    gamesPerWeek: PropTypes.number.isRequired,
  }).isRequired,
  availability: PropTypes.object.isRequired,
  setAvailability: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  setConstraints: PropTypes.func.isRequired, // New prop
};

export default ScheduleGrid;