export const userResolvers = {
  User: {
    id: (user) => {
      return user._id;
    },
  },
};
