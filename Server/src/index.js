const app = require('./app');
const { runMigrations } = require('./db/migrate');

const PORT = process.env.PORT || 3000;

runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API docs available at http://localhost:${PORT}/api-docs`);
  });
});
