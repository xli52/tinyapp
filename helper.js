// Helper function that generate a random 6-character string
const generateRandomString = function() {
  const charString = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * charString.length);
    randomString += charString.charAt(randomIndex);
  }
  return randomString;
};

// Helper function that find the userID from a given email address
const findUserIDWithEmail = function(email, users) {
  let foundUserID = null;
  for (const userID in users) {
    if (users[userID].email === email) foundUserID = userID;
  }
  return foundUserID;
};

module.exports = { generateRandomString, findUserIDWithEmail };