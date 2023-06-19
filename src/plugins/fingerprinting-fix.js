module.exports = {
  hydrate: {
    copy: async ({ arc, inventory, copy }) => {
      await copy({
        source: './public/static.json',
        target: '@architect/shared/static.json',
      });
    },
  },
};
