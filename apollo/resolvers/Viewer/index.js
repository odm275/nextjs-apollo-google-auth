const cookieOptions = {
  httpOnly: true,
  sameSite: true,
  signed: true,
  secure: process.env.NODE_ENV === "development" ? false : true,
};
const logInViaGoogle = async (code, token, db, res) => {
  const { user } = await Google.logIn(code);

  if (!user) {
    throw new Error("Google login error");
  }

  // Names/Photos/Email Lists
  const userNamesList = user.names && user.names.length ? user.names : null;
  const userPhotosList = user.photos && user.photos.length ? user.photos : null;
  const userEmailsList =
    user.emailAddresses && user.emailAddresses.length
      ? user.emailAddresses
      : null;

  // User Display Name
  const userName = userNamesList ? userNamesList[0].displayName : null;

  // User Id
  const userId =
    userNamesList &&
    userNamesList[0].metadata &&
    userNamesList[0].metadata.source
      ? userNamesList[0].metadata.source.id
      : null;

  // User Avatar
  const userAvatar =
    userPhotosList && userPhotosList[0].url ? userPhotosList[0].url : null;

  // User Email
  const userEmail =
    userEmailsList && userEmailsList[0].value ? userEmailsList[0].value : null;

  if (!userId || !userName || !userAvatar || !userEmail) {
    throw new Error("Google login error");
  }
  const updateRes = await db.users.findOneAndUpdate(
    { _id: userId },
    {
      $set: {
        name: userName,
        avatar: userAvatar,
        email: userEmail,
        token,
      },
    },
    { returnOriginal: false }
  );

  let viewer = updateRes.value;
  if (!viewer) {
    const insertResult = await db.users.insertOne({
      _id: userId,
      token,
      name: userName,
      avatar: userAvatar,
      email: userEmail,
      tasks: [],
    });
    viewer = insertResult.ops[0];
  }

  const cryptr = new Cryptr(process.env.SECRET);
  const encryptedUserId = cryptr.encrypt(userId);

  // Typescript tries to type
  res.cookie("viewer", encryptedUserId, {
    ...cookieOptions,
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });

  return viewer;
};

const logInViaCookie = async (token, db, req, res) => {
  // grab viewer cookie
  // Decrypt it to its userID
  // Look for userID in the db that matches decrypted ID.

  const viewerCookie = req.cookies.viewer;
  const cryptr = new Cryptr(process.env.SECRET);
  const decryptedUserId = viewerCookie ? cryptr.decrypt(viewerCookie) : null;
  const updateRes = await db.users.findOneAndUpdate(
    { _id: decryptedUserId },
    { $set: { token } },
    { returnOriginal: false }
  );

  const viewer = updateRes.value;
  if (!viewer) {
    res.clearCookie(res, "viewer");
  }
  return viewer;
};

export const viewerResolvers = {
  Query: {
    authUrl: () => {
      try {
        return Google.authUrl;
      } catch (error) {
        throw new Error(`Failed to query Google Auth Url: ${error}`);
      }
    },
  },
  Mutation: {
    logIn: async (__root, { input }, { db, req, res }) => {
      try {
        console.log("hi");
        const code = input ? input.code : null; // Comes from google after clicking sign in and being re-directed back to the app
        const token = crypto.randomBytes(16).toString("hex");

        const viewer = code
          ? await logInViaGoogle(code, token, db, res)
          : await logInViaCookie(token, db, req, res); // req object will have the cookie

        console.log("viewer in server", viewer);

        if (!viewer) {
          return {
            didRequest: true,
          };
        }
        return {
          _id: viewer._id,
          token: viewer.token,
          avatar: viewer.avatar,
          walletId: viewer.walletId,
          didRequest: true,
        };
      } catch (error) {
        throw new Error(`Failed to log in: ${error}`);
      }
    },
  },
};
