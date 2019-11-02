let firebaseConfig;

// Pull the proper Firebase config file from the config/ directory depending on the environment. Use
// a variable for the config filename so React will not fail to compile things because the config
// file is actually outside the src/ directory.
try {
  const configFilename =
    process.env.NODE_ENV === 'production' ? 'config.prod.json' : 'config.dev.json';
  firebaseConfig = require(`../../config/${configFilename}`).firebase;
} catch (error) {
  // eslint-disable-next-line no-console
  console.log('Failed to load config file:', error);
}

export default firebaseConfig;
