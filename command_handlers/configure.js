const prompt = require("prompt");
const shell = require("shelljs");
const fs = require("fs");
const ora = require("ora");
const { getFirebaseProjects } = require("../helpers/firebase_helper.js");
const {
  currentDirIsCombustApp,
  nonCombustAppErr
} = require("../helpers/fs_helper.js");

module.exports = function(dbSpecified) {
  if (!currentDirIsCombustApp()) {
    return console.error(nonCombustAppErr);
  }
  if (dbSpecified) {
    return setWorkingProject(dbSpecified);
  }
  getFirebaseProjects((err, projects) => {
    if (!projects) return null;
    printAvailableProjects(projects);
    console.log("\nSelect an application by number".yellow);
    getUserChoice(projects);
  });
};

printAvailableProjects = projects => {
  projects.forEach((project, i) => {
    console.log(`(${i + 1}): ${project.id}`);
  });
};

function getUserChoice(projectNames, callback) {
  prompt.message = "";
  prompt.start();
  let regexp = projectNames.length > 9 ? /^[1-9][0-9]+$/ : /^[1-9]+$/;
  prompt.get(
    [
      {
        name: "Project Number",
        conform: value => {
          return !isNaN(value) && value > 0 && value <= projectNames.length;
        },
        warning: "Project must be chosen by number"
      }
    ],
    (err, result) => {
      if (err) {
        return callback(onErr(err));
      }

      const index = result["Project Number"];
      if (index > projectNames.length) {
        return console.error("Project index out of range, try again.");
      }
      setWorkingProject(projectNames[index - 1].id);
    }
  );

  onErr = err => {
    console.log(err);
    return 1;
  };
}

function setWorkingProject(projectId) {
  spinner = ora("Fetching the configuration").start();
  shell.exec("firebase use --add " + projectId, {
    silent: true
  });
  shell.exec(
    "firebase setup:web",
    {
      silent: true,
      async: true
    },
    (code, stdout, stderr) => {
      spinner.clear();
      spinner.stop();
      if (stderr) {
        console.log("err:", stderr);
      } else {
        spinner = ora("Applying config").start();

        const patternStart = "firebase.initializeApp(";

        const config = stdout.substring(
          stdout.indexOf(patternStart) + patternStart.length,
          stdout.indexOf("});") + 1
        );
        writeConfigToFile(config);
        spinner.clear();
        spinner.stop();

        console.log(
          "\nApplied new configuration to: " +
            "src/.combust/config".green +
            "\n\nAwesome! Firebase should be all hooked up!".yellow
        );
      }
    }
  );
}

function writeConfigToFile(newConfig) {
  fs.writeFile(
    "./src/.combust/config.js",
    "export const firebaseConfig = " + newConfig,
    err => {
      err && console.log("err updating config:" + err);
    }
  );
}

//OLD WAY - might be necessary to use the api later
// const api = require("../node_modules/firebase-tools/lib/api");
// const firebaseLogin = require("../node_modules/firebase-tools/commands/login-ci.js");

// firebaseLogin._action({}).then(result => {
//   const token = result.tokens.access_token;
//   api.setAccessToken(token);
//   getProjects();
// });

// getProjects = () => {
//   let spinner = ora("Fetching your firebase apps").start();

//   api
//     .getProjects()
//     .then(projects => {
//       spinner.clear();
//       spinner.stop();
//       console.log("\nSelect a Firebase project:");
//       const projectNames = projects && Object.keys(projects);
//       projectNames.forEach((proj, i) => {
//         console.log(i + ") " + proj);
//       });
//       getUserChoice(projectNames);
//     })
//     .catch(err => {
//       console.log(err);
//     });
// };
