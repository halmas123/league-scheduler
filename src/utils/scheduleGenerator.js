// src/utils/scheduleGenerator.js

export const generateSchedule = async (teamNames, teamConstraints, config, signal) => {
    const N = teamNames.length;
    const numGamesPerTeam = config.gamesPerTeam;
    const numGamesPerWeek = config.gamesPerWeek;
    const weeks = Math.ceil((N * numGamesPerTeam) / (2 * numGamesPerWeek));
    const byesPerTeam = weeks - numGamesPerTeam;
    console.log(
      `There will be ${weeks} weeks, and ${byesPerTeam} byes for each team`
    );
  
    // Generate all possible unique team pairings
    const allGames = new Set();
    for (let a = 0; a < N; a++) {
      for (let b = a + 1; b < N; b++) {
        allGames.add(`${a}-${b}`);
      }
    }
  
    // Initialize team games left
    const teamGamesLeft = Array(N).fill(numGamesPerTeam);
  
    // Initialize constraints per week
    const constraintsPerWeek = Array.from({ length: weeks }, () => []);
    Object.entries(teamConstraints).forEach((unavailableWeeks) => {
        var teamName = unavailableWeeks[0];
        var teamIndex = teamNames.indexOf(teamName);
        
      unavailableWeeks[1].forEach((week) => {
        if (week < weeks) {
          constraintsPerWeek[week].push(teamIndex);
        }
      });
    });
  
    // Calculate max games per week
    const maxGamesInWeek = constraintsPerWeek.map(
      (weekConstraints) =>
        Math.min(
          Math.floor((N - weekConstraints.length) / 2),
          numGamesPerWeek
        )
    );
    
    // Calculate upcoming byes
    const upcomingByes = Array.from({ length: N }, () => Array(weeks).fill(0));
    for (let i = weeks - 1; i >= 0; i--) {
      constraintsPerWeek[i].forEach((team) => {
        upcomingByes[team][i] += 1;
      });
      if (i < weeks - 1) {
        for (let j = 0; j < N; j++) {
          upcomingByes[j][i] += upcomingByes[j][i + 1];
        }
      }
    }
  
    const gamesPlayed = new Set();
    const gamesPerWeek = [];
  
    // Backtracking function 1
    const backtrack1 = (weekNum) => {
      console.log(`Week: ${weekNum + 1}`);
      const remainingMaxGames = maxGamesInWeek
        .slice(weekNum)
        .reduce((a, b) => a + b, 0);
      const remainingGamesNeeded =
        teamGamesLeft.reduce((a, b) => a + b, 0) / 2;
      console.log(`Remaining Max Games: ${remainingMaxGames}`);
      console.log(`Remaining Games Needed: ${remainingGamesNeeded}`);
  
      if (remainingMaxGames < remainingGamesNeeded) {
        return false;
      }
      
      console.log(`Team Games Left: ${teamGamesLeft}`);
      if (weekNum === weeks) {
        console.log(teamGamesLeft);
        gamesPerWeek.forEach((weekGames) => console.log(weekGames));
        return teamGamesLeft.every((gamesLeft) => gamesLeft === 0);
      }
  
      for (let teamNum = 0; teamNum < N; teamNum++) {
        const gamesLeft = teamGamesLeft[teamNum];
        if (
          gamesLeft + upcomingByes[teamNum][weekNum] > weeks - weekNum
        ) {
          return false;
        }
      }
      console.log("Starting backtrack2");
      return backtrack2(weekNum, gamesPerWeek[weekNum] || [], []);
    };
  
    // Backtracking function 2
    const backtrack2 = (weekNum, gamesThisWeek, teamsPlaying) => {
      if (
        gamesThisWeek.length === maxGamesInWeek[weekNum]
         ||
        (allGames.size - gamesPlayed.size) <=
          numGamesPerWeek * (weeks - weekNum - 1)
      ) {
        gamesPerWeek[weekNum] = [...gamesThisWeek];
        if (backtrack1(weekNum + 1)) {
          return true;
        }
        gamesPerWeek.pop();
        if (gamesThisWeek.length === maxGamesInWeek[weekNum]) {
          return false;
        }
      }
      for (let game of allGames) {
        const [A, B] = game.split('-').map(Number);
        if (
          !gamesPlayed.has(game) &&
          !constraintsPerWeek[weekNum].includes(A) &&
          !constraintsPerWeek[weekNum].includes(B) &&
          !teamsPlaying.includes(A) &&
          !teamsPlaying.includes(B) &&
          teamGamesLeft[A] > 0 &&
          teamGamesLeft[B] > 0
        ) {
          gamesPlayed.add(game);
          gamesThisWeek.push(game);
          teamGamesLeft[A] -= 1;
          teamGamesLeft[B] -= 1;
  
          if (backtrack2(weekNum, gamesThisWeek, [...teamsPlaying, A, B])) {
            return true;
          }
  
          gamesPlayed.delete(game);
          gamesThisWeek.pop();
          teamGamesLeft[A] += 1;
          teamGamesLeft[B] += 1;
        }
      }
  
      return false;
    };
  
    console.log("Starting search for schedule");
    const found = backtrack1(0);
    if (found) {
      for (let i = 0; i < weeks; i++) {
        const teamsPlaying = new Set();
        gamesPerWeek[i].forEach((game) => {
          const [A, B] = game.split('-').map(Number);
          teamsPlaying.add(A);
          teamsPlaying.add(B);
        });
        const byes = teamNames.filter((_, idx) => !teamsPlaying.has(idx));
        const games = gamesPerWeek[i].map(
          (game) => `${teamNames[game.split('-')[0]]} vs ${teamNames[game.split('-')[1]]}`
        );
  
        console.log(
          `Week ${i + 1}: Games: ${games} Byes: ${byes}`
        );
      }
      return {
        success: true,
        schedule: gamesPerWeek.map((weekGames) =>
          weekGames.map((game) => {
            const [A, B] = game.split('-').map(Number);
            return [teamNames[A], teamNames[B]];
          })
        ),
      };
    } else {
      console.log("No solution found");
      return {
        success: false,
        message: "Unable to generate a valid schedule with the given constraints.",
      };
    }
  };